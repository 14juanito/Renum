import "server-only";
import bcrypt from "bcryptjs";
import { createUser, findUserByEmail, getSettings, newId, newRef, nowIso, saveNeed, saveSettings, saveStructure } from "./db";
import { classifyLocal } from "./ai-local";
import { computeTotal, toUsd } from "./rules";
import type { Need, Structure, User } from "./types";

let seeding: Promise<void> | null = null;

/** Initialisation idempotente : paramètres, administrateur initial, jeu de démonstration optionnel. */
export function ensureSeeded() {
  // Jamais pendant le build : aucune écriture dans le stockage de production à la compilation.
  if (process.env.NEXT_PHASE === "phase-production-build") return Promise.resolve();
  return (seeding ??= doSeed().catch((e) => {
    seeding = null;
    console.error("[seed]", e);
  }));
}

async function doSeed() {
  const settings = await getSettings();
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const adminPw = process.env.ADMIN_PASSWORD;
  if (adminEmail && adminPw && !(await findUserByEmail(adminEmail))) {
    await createUser({
      id: newId(), email: adminEmail, passwordHash: await bcrypt.hash(adminPw, 11), role: "admin", status: "active",
      emailVerified: true, failedLogins: 0, tokenVersion: 1, createdAt: nowIso(), lastName: "Administrateur", firstName: "RENUM",
      title: "Administrateur fonctionnel",
    });
  }
  if (settings.seeded) return;
  // Marqueur posé avant le chargement pour limiter les doubles initialisations concurrentes.
  await saveSettings({ ...settings, seeded: true });
  if (process.env.SEED_DEMO === "1") await seedDemo(settings.rateCdfPerUsd);
}

const DEMO: [string, string, string, string, string][] = [
  ["Ministère des Postes, Télécommunications et Numérique", "PTN", "T02", "Kinshasa", "Gombe"],
  ["Direction Générale des Impôts", "DGI", "T03", "Kinshasa", "Gombe"],
  ["Office National d'Identification de la Population", "ONIP", "T04", "Kinshasa", "Gombe"],
  ["Autorité de Régulation de la Poste et des Télécommunications", "ARPTC", "T06", "Kinshasa", "Gombe"],
  ["Gouvernorat du Haut-Katanga", "GHK", "T07", "Haut-Katanga", "Lubumbashi"],
  ["Gouvernorat du Nord-Kivu", "GNK", "T07", "Nord-Kivu", "Goma"],
  ["Ville de Kisangani", "VKIS", "T08", "Tshopo", "Kisangani"],
  ["Division provinciale de la Santé du Kasaï-Central", "DPS-KC", "T09", "Kasaï-Central", "Kananga"],
  ["Société Nationale d'Électricité", "SNEL", "T05", "Kinshasa", "Gombe"],
  ["Université de Kinshasa", "UNIKIN", "T04", "Kinshasa", "Lemba"],
  ["Gouvernorat du Kongo-Central", "GKC", "T07", "Kongo-Central", "Matadi"],
  ["Direction Générale des Douanes et Accises", "DGDA", "T03", "Kinshasa", "Gombe"],
];

const DEMO_NEEDS: [string, string, number, number, string, string][] = [
  ["Acquisition de postes de travail", "Achat d'ordinateurs de bureau et d'imprimantes pour les agents de la direction administrative.", 40, 850, "haute", "investissement"],
  ["Connexion Internet par fibre optique", "Raccordement du siège à la fibre optique avec un débit dédié de 100 Mbps et installation d'un réseau Wi-Fi.", 1, 18000, "critique", "fonctionnement"],
  ["Mise en place d'un pare-feu et antivirus", "Déploiement d'un pare-feu de nouvelle génération et de licences antivirus pour sécuriser le réseau interne.", 1, 12000, "haute", "investissement"],
  ["Logiciel de gestion du courrier (GED)", "Mise en place d'une application de gestion électronique des documents et du courrier entrant et sortant.", 1, 25000, "moyenne", "investissement"],
  ["Onduleurs et kit solaire pour la salle serveur", "Installation d'onduleurs et de panneaux solaires pour assurer la continuité face aux délestages fréquents.", 1, 15000, "critique", "investissement"],
  ["Formation des agents à la bureautique", "Formation de 60 agents aux outils bureautiques et à la sécurité numérique de base.", 60, 120, "moyenne", "fonctionnement"],
  ["Portail de téléservices pour les usagers", "Développement d'un portail en ligne permettant aux citoyens de déposer leurs demandes et payer par mobile money.", 1, 60000, "haute", "investissement"],
  ["Contrat de maintenance du parc informatique", "Contrat annuel de maintenance et d'assistance pour le parc informatique, incluant les pièces de rechange.", 1, 9000, "basse", "fonctionnement"],
  ["Numérisation des archives", "Numérisation des archives papier et création d'une base de données consultable pour les dossiers historiques.", 1, 30000, "moyenne", "investissement"],
  ["Hébergement cloud des applications", "Migration des applications vers un hébergement cloud mutualisé avec sauvegardes automatiques quotidiennes.", 12, 1500, "haute", "fonctionnement"],
  ["Schéma directeur informatique", "Élaboration d'un schéma directeur des systèmes d'information et accompagnement à la conduite du changement.", 1, 40000, "moyenne", "investissement"],
];

async function seedDemo(rate: number) {
  const now = Date.now();
  let k = 0;
  for (let i = 0; i < DEMO.length; i++) {
    const [name, acronym, typeCode, province, city] = DEMO[i];
    const createdAt = new Date(now - (DEMO.length - i) * 7200_000).toISOString();
    const owner: User = {
      id: newId(), email: `demo.${acronym.toLowerCase().replace(/[^a-z0-9]/g, "")}@renum.demo`, passwordHash: "!", role: "responsable",
      status: "suspended", emailVerified: true, failedLogins: 0, tokenVersion: 1, createdAt, lastName: "Démo", firstName: acronym,
      title: "Responsable des systèmes d'information", phone: "+243810000000", postStatus: "titulaire", consentPublish: true, demo: true,
    };
    const s: Structure = {
      id: newId(), name, acronym, typeCode, province, city, email: `contact@${acronym.toLowerCase().replace(/[^a-z0-9]/g, "")}.demo`,
      tutelle: typeCode === "T02" ? "" : "Ministère de tutelle", staff: 50 + i * 37, status: i % 4 === 0 ? "soumise" : "validee",
      ownerId: owner.id, createdAt, updatedAt: createdAt, demo: true,
    };
    owner.structureId = s.id;
    await createUser(owner);
    await saveStructure(s);
    const count = 2 + (i % 3);
    for (let j = 0; j < count; j++) {
      const [title, description, quantity, unitCost, priority, costNature] = DEMO_NEEDS[k++ % DEMO_NEEDS.length];
      const totalCost = computeTotal(quantity, unitCost);
      const ai = classifyLocal(`${title}. ${description}`);
      const at = new Date(new Date(createdAt).getTime() + (j + 1) * 1800_000).toISOString();
      const n: Need = {
        id: newId(), ref: newRef("BES"), structureId: s.id, authorId: owner.id, title, description, quantity, unitCost, totalCost,
        currency: "USD", priority, costNature, horizon: j % 2 ? "6to12" : "lt6", mutualisable: j % 2 === 0,
        categoryCode: ai.category, status: s.status === "validee" ? "valide" : "soumis", rateApplied: rate,
        amountUsd: toUsd(totalCost, "USD", rate), submittedAt: at, createdAt: at, updatedAt: at, demo: true,
        ai: { ...ai, at, decision: s.status === "validee" ? "accepted" : null },
      };
      await saveNeed(n);
    }
  }
}
