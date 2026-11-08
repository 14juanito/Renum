# RENUM — Registre national des responsables numériques

Plateforme de recensement des responsables numériques des administrations et de collecte de leurs besoins numériques
(cahier des charges CDC-RENUM-2026-001, v1.0). Ce dépôt implémente le **MVP P1 « Journées »** et une partie des exigences P2.

## Pile

| Couche | Choix |
|---|---|
| Interface + API | Next.js 16 (App Router, Server Actions), TypeScript, Tailwind CSS 4, PWA (manifest) |
| Persistance | Adaptateur documentaire : **PostgreSQL** (`DATABASE_URL`, table JSONB) › **Vercel Blob privé** (`BLOB_READ_WRITE_TOKEN`) › fichiers locaux (dev) |
| Auth | Sessions JWT HS256 (cookie `httpOnly`, `SameSite=Lax`, 8 h), bcrypt, OTP e-mail, révocation par `tokenVersion` |
| IA | Claude API (`@anthropic-ai/sdk`, sortie structurée) si `ANTHROPIC_API_KEY`, sinon classifieur local par mots-clés |
| Rapports | pdf-lib (accusé, note au Ministre), ExcelJS (exports + dictionnaire de données), CSV |
| Graphiques | Recharts |

## Démarrage

```bash
npm install
cp .env.example .env.local   # renseigner SESSION_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD
npm run dev
```

```bash
npm test          # règles de gestion (coûts, devises, RG3, complétude, anti-injection CSV, anomalies, classifieur)
npm run build
```

Variables : voir `.env.example`. Le compte administrateur est créé au premier accès à partir de `ADMIN_EMAIL` / `ADMIN_PASSWORD`.
`SEED_DEMO=1` charge 12 structures et 36 besoins fictifs (purgeables depuis *Paramètres*).

## Couverture fonctionnelle (P1)

| Module | Exigences couvertes |
|---|---|
| M1 Portail | EF-PUB-01..05, 07, 09 (accueil, CTA, décompte, compteurs activables, étapes, pages légales), FAQ recherchable (06) |
| M2 Auth | EF-AUT-01..05, 09, 11, 12 (inscription, OTP, robustesse MDP, réinitialisation 30 min, verrouillage 5 échecs/15 min, RBAC, suspension) |
| M3 Recensement | EF-STR-01..06, 08, 09 ; EF-RSP-01..04, 07 ; EF-ANN-01..04, 06 ; détection de doublons (STR-07) |
| M4 Besoins | EF-BES-01..10, 13, 15..20, 25 (assistant 4 étapes, autosauvegarde locale, coût auto, USD/CDF à taux figé, récap, déclaration, accusé PDF horodaté, verrouillage campagne) |
| M5 Référentiels | Annexes A/B, 26 provinces, priorités, statuts, devises |
| M6 Back-office | EF-ADM-01..05, 08, 11 (files de validation avec motif, annotation interne, lot, utilisateurs, paramètres, couverture) |
| M7 Tableau de bord | EF-TDB-01..04, 06, 08, 09, 10, 13, 14, 16 (KPI, répartitions, filtres combinables, export, auto-actualisation, vue décideur) |
| M8 Rapports | EF-RAP-01 (note au Ministre PDF, annexe D), 04, 05 |
| M9 IA | EF-IA-01, 02, 08, 11, 12 + anomalies de coût IQR (06), pistes de mutualisation (aperçu 05) |
| M11 Événement | EF-EVT-01..03, 09, 10 (QR, écran live animé avec rotation, saisie assistée, formulaire Excel de secours + import) |
| M13 Audit | EF-LOG-01..03 (journal append-only : utilisateur, IP, action, avant/après) |

## Sécurité (OWASP ASVS / Top 10)

- Contrôle d'accès vérifié côté serveur sur **chaque** page, action et route API ; contrôle d'appartenance objet (anti-IDOR).
- Mots de passe bcrypt (coût 11), réponse en temps constant et messages génériques (anti-énumération), verrouillage de compte, limitation de débit par IP.
- Jetons OTP/réinitialisation stockés hachés (SHA-256), durée limitée, tentatives bornées ; changement de MDP ⇒ révocation des sessions.
- En-têtes : HSTS, CSP, `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`. Server Actions protégées par vérification d'origine (CSRF).
- Exports protégés contre l'injection de formules (CSV/Excel). Pseudonymisation (e-mails, téléphones, URL) avant tout appel au modèle de langage ; le texte du besoin est traité comme donnée.
- Les chiffres de la note au Ministre sont calculés en base ; le modèle ne fait que rédiger (§7.4).
- Blob en accès **privé** ; `SESSION_SECRET` obligatoire sur tout déploiement (le démarrage échoue sinon).

## Limites connues / avant production

- **Mode démo e-mail** : sans `RESEND_API_KEY`/`EMAIL_FROM`, les OTP et liens de réinitialisation s'affichent à l'écran — **à désactiver avant ouverture publique** (sinon n'importe qui peut valider une adresse qui n'est pas la sienne).
- Le stockage Blob (un objet par document) convient au MVP ; pour 500 utilisateurs simultanés et des dizaines de milliers de besoins, basculer sur PostgreSQL (`DATABASE_URL`, aucune modification de code).
- Limitation de débit en mémoire par instance (complément au verrouillage persistant) : prévoir WAF/Redis en production.
- CSP avec `'unsafe-inline'` pour les scripts (requis par Next sans nonces) ; durcissement par nonce en P2.
- Non implémentés (P2/P3) : 2FA, SMS/WhatsApp, pièces jointes + antivirus, commentaires fil, carte choroplèthe, émargement/badges/attestations, regroupement sémantique, assistant conversationnel, édition en ligne des référentiels.
