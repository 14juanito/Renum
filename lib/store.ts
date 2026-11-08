import "server-only";
import { promises as fs } from "fs";
import path from "path";

/**
 * Stockage documentaire minimal (collection / id -> JSON).
 * Backends, par ordre de priorité :
 *  - PostgreSQL (DATABASE_URL) : table unique `docs` en JSONB — recommandé en production ;
 *  - Vercel Blob privé (BLOB_READ_WRITE_TOKEN) : un objet par document, lecture sans cache CDN ;
 *  - Fichiers locaux (.data/ ou /tmp) : développement uniquement.
 */
export interface Store {
  readonly kind: "postgres" | "blob" | "file";
  get<T>(col: string, id: string): Promise<T | null>;
  list<T>(col: string): Promise<T[]>;
  put<T extends { id: string }>(col: string, doc: T): Promise<void>;
  del(col: string, id: string): Promise<void>;
}

const SAFE = /^[a-zA-Z0-9_-]{1,80}$/;
function assertKey(col: string, id: string) {
  if (!SAFE.test(col) || !SAFE.test(id)) throw new Error("Clé de stockage invalide");
}

/* ---------------- PostgreSQL ---------------- */
function pgStore(url: string): Store {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const postgres = require("postgres") as typeof import("postgres").default;
  const sql = postgres(url, { max: 5, idle_timeout: 20, prepare: false });
  let ready: Promise<unknown> | null = null;
  const init = () =>
    (ready ??= sql`create table if not exists docs (
      col text not null, id text not null, data jsonb not null,
      updated_at timestamptz not null default now(), primary key (col, id))`);
  return {
    kind: "postgres",
    async get<T>(col: string, id: string) {
      assertKey(col, id);
      await init();
      const rows = await sql`select data from docs where col = ${col} and id = ${id}`;
      return (rows[0]?.data as T) ?? null;
    },
    async list<T>(col: string) {
      await init();
      const rows = await sql`select data from docs where col = ${col}`;
      return rows.map((r) => r.data as T);
    },
    async put(col, doc) {
      assertKey(col, doc.id);
      await init();
      await sql`insert into docs (col, id, data) values (${col}, ${doc.id}, ${sql.json(doc as never)})
        on conflict (col, id) do update set data = excluded.data, updated_at = now()`;
    },
    async del(col, id) {
      assertKey(col, id);
      await init();
      await sql`delete from docs where col = ${col} and id = ${id}`;
    },
  };
}

/* ---------------- Vercel Blob (privé) ---------------- */
function blobStore(): Store {
  const pathFor = (col: string, id: string) => `db/${col}/${id}.json`;
  async function read<T>(pathname: string): Promise<T | null> {
    const { get } = await import("@vercel/blob");
    const res = await get(pathname, { access: "private", useCache: false });
    if (!res || res.statusCode !== 200) return null;
    return JSON.parse(await new Response(res.stream).text()) as T;
  }
  return {
    kind: "blob",
    async get<T>(col: string, id: string) {
      assertKey(col, id);
      try {
        return await read<T>(pathFor(col, id));
      } catch (e) {
        if ((e as Error).name === "BlobNotFoundError") return null;
        throw e;
      }
    },
    async list<T>(col: string) {
      const { list } = await import("@vercel/blob");
      const paths: string[] = [];
      let cursor: string | undefined;
      do {
        const page = await list({ prefix: `db/${col}/`, cursor, limit: 1000 });
        paths.push(...page.blobs.map((b) => b.pathname));
        cursor = page.hasMore ? page.cursor : undefined;
      } while (cursor);
      const out: T[] = [];
      const CONC = 32;
      for (let i = 0; i < paths.length; i += CONC) {
        const chunk = await Promise.all(paths.slice(i, i + CONC).map((p) => read<T>(p).catch(() => null)));
        for (const d of chunk) if (d) out.push(d);
      }
      return out;
    },
    async put(col, doc) {
      assertKey(col, doc.id);
      const { put } = await import("@vercel/blob");
      await put(pathFor(col, doc.id), JSON.stringify(doc), {
        access: "private",
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: "application/json",
      });
    },
    async del(col, id) {
      assertKey(col, id);
      const { del } = await import("@vercel/blob");
      await del(pathFor(col, id)).catch(() => undefined);
    },
  };
}

/* ---------------- Fichiers locaux ---------------- */
function fileStore(): Store {
  const root = process.env.VERCEL ? "/tmp/renum-data" : path.join(process.cwd(), ".data");
  const file = (col: string, id: string) => path.join(root, col, `${id}.json`);
  return {
    kind: "file",
    async get<T>(col: string, id: string) {
      assertKey(col, id);
      try {
        return JSON.parse(await fs.readFile(file(col, id), "utf8")) as T;
      } catch {
        return null;
      }
    },
    async list<T>(col: string) {
      const dir = path.join(root, col);
      let names: string[] = [];
      try {
        names = await fs.readdir(dir);
      } catch {
        return [];
      }
      const docs = await Promise.all(
        names.filter((n) => n.endsWith(".json")).map(async (n) => JSON.parse(await fs.readFile(path.join(dir, n), "utf8")) as T),
      );
      return docs;
    },
    async put(col, doc) {
      assertKey(col, doc.id);
      await fs.mkdir(path.join(root, col), { recursive: true });
      const target = file(col, doc.id);
      const tmp = `${target}.${process.pid}.tmp`;
      await fs.writeFile(tmp, JSON.stringify(doc));
      await fs.rename(tmp, target);
    },
    async del(col, id) {
      assertKey(col, id);
      await fs.rm(file(col, id), { force: true });
    },
  };
}

/* ---------------- Cache léger par instance ---------------- */
function cached(inner: Store, ttlMs = 4000): Store {
  const cache = new Map<string, { at: number; data: unknown[] }>();
  return {
    kind: inner.kind,
    get: (c, i) => inner.get(c, i),
    async list<T>(col: string) {
      const hit = cache.get(col);
      if (hit && Date.now() - hit.at < ttlMs) return hit.data as T[];
      const data = await inner.list<T>(col);
      cache.set(col, { at: Date.now(), data });
      return data;
    },
    async put(col, doc) {
      await inner.put(col, doc);
      const hit = cache.get(col);
      if (hit) {
        const arr = (hit.data as { id: string }[]).filter((d) => d.id !== doc.id);
        arr.push(doc);
        hit.data = arr;
      }
    },
    async del(col, id) {
      await inner.del(col, id);
      const hit = cache.get(col);
      if (hit) hit.data = (hit.data as { id: string }[]).filter((d) => d.id !== id);
    },
  };
}

const g = globalThis as unknown as { __renumStore?: Store };
export function store(): Store {
  if (!g.__renumStore) {
    const base = process.env.DATABASE_URL
      ? pgStore(process.env.DATABASE_URL)
      : process.env.BLOB_READ_WRITE_TOKEN
        ? blobStore()
        : fileStore();
    g.__renumStore = cached(base);
  }
  return g.__renumStore;
}
