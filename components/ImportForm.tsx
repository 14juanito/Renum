"use client";
import { ActionForm, Submit } from "./forms";
import { importAction } from "@/app/actions/admin";

export function ImportForm() {
  return (
    <ActionForm action={importAction} className="card space-y-3">
      <label className="label" htmlFor="file">Fichier du formulaire de secours (.xlsx, 5 Mo max.)</label>
      <input id="file" name="file" type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" required className="input" />
      <Submit>Importer</Submit>
    </ActionForm>
  );
}
