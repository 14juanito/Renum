import { test } from "node:test";
import assert from "node:assert/strict";
import { completeness, computeTotal, costOutliers, needSubmittable, normalizePhone, passwordIssues, safeCell, similarity, toCsv, toUsd } from "../lib/rules";
import { classifyLocal } from "../lib/ai-local";

test("RG5 coût total = quantité × coût unitaire", () => {
  assert.equal(computeTotal(3, 100.555), 301.67);
  assert.equal(computeTotal(0, 100), 0);
  assert.equal(computeTotal(-2, 100), 0);
  assert.equal(computeTotal(3, 100, 250), 250); // montant global justifié
});

test("conversion CDF -> USD avec taux figé", () => {
  assert.equal(toUsd(2850, "CDF", 2850), 1);
  assert.equal(toUsd(10, "USD", 2850), 10);
  assert.throws(() => toUsd(10, "CDF", 0));
});

test("RG3 contrôle de soumission d'un besoin", () => {
  const base = { title: "PC", categoryCode: "B01", description: "x".repeat(30), quantity: 1, unitCost: 10, totalCost: 10, priority: "haute", currency: "USD" };
  assert.deepEqual(needSubmittable(base as never), []);
  assert.ok(needSubmittable({ ...base, description: "court" } as never).length);
  assert.ok(needSubmittable({ ...base, categoryCode: "B12" } as never).some((e) => e.includes("Autre")));
  assert.ok(needSubmittable({ ...base, title: "x".repeat(121) } as never).length);
});

test("complétude", () => {
  const c = completeness({ a: "x", b: "", c: 1 } as Record<string, unknown>, ["a", "b"], ["c"]);
  assert.equal(c.pct, 67);
  assert.equal(c.complete, false);
});

test("politique de mot de passe", () => {
  assert.ok(passwordIssues("abc").length >= 3);
  assert.deepEqual(passwordIssues("Renum!2026xx"), []);
});

test("normalisation téléphone +243", () => {
  assert.equal(normalizePhone("0812 345 678"), "+243812345678");
  assert.equal(normalizePhone("00243812345678"), "+243812345678");
  assert.equal(normalizePhone("243812345678"), "+243812345678");
});

test("anti-injection de formules tableur", () => {
  assert.equal(safeCell("=HYPERLINK(\"x\")"), "'=HYPERLINK(\"x\")");
  assert.equal(safeCell("+1"), "'+1");
  assert.equal(safeCell(12), 12);
  assert.ok(toCsv([{ a: "=1+1" }], [{ key: "a", label: "A" }]).includes("'=1+1"));
});

test("similarité de noms (doublons)", () => {
  assert.ok(similarity("Direction Générale des Impôts", "direction generale impots") >= 0.8);
  assert.ok(similarity("Ministère de la Santé", "Ville de Kisangani") < 0.3);
});

test("détection d'anomalies de coût (IQR)", () => {
  const vals = [10, 11, 12, 13, 12, 11, 10, 500].map((v, i) => ({ id: String(i), v }));
  assert.deepEqual([...costOutliers(vals)], ["7"]);
});

test("classifieur local", () => {
  assert.equal(classifyLocal("Achat de 20 ordinateurs et imprimantes").category, "B01");
  assert.equal(classifyLocal("Raccordement à la fibre optique et Wi-Fi").category, "B02");
  assert.equal(classifyLocal("Installation d'onduleurs et panneaux solaires").category, "B08");
  assert.equal(classifyLocal("Pare-feu et antivirus pour sécuriser le réseau").category, "B05");
  assert.equal(classifyLocal("zzz").category, "B12");
});
