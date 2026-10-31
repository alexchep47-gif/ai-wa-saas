# AI WA SaaS

Service multi-tenant pour agents WhatsApp éducatifs (établissements scolaires, Cameroun).

**Dashboard web** pour configurer et surveiller. **Workers serveur** pour les connexions 24/7.  
Premier pilote : **CMR SCHOOL / Mathsfor.all**.

Monolithe Baileys d’origine : [ai-wa-agent](https://github.com/alexchep47-gif/ai-wa-agent).

---

## Stack

| Couche | Techno |
|--------|--------|
| App | Next.js 16 (App Router) + React 19 + Tailwind |
| Data | Prisma · SQLite (prototype uniquement ; la migration Postgres est à faire avant une production multi-instance) |
| Auth | Sessions JWT httpOnly + hash bcrypt |
| CI | GitHub Actions (`ci.yml`) |
| WhatsApp | Cloud API (cible) · Baileys (prototype) |

---

## Démarrage local

```bash
npm install
cp .env.example .env
# Renseigner AUTH_SECRET, META_APP_SECRET, WHATSAPP_VERIFY_TOKEN et
# WHATSAPP_TOKEN_ENCRYPTION_KEY dans .env avant un vrai déploiement.
npx prisma db push
# Pour charger un compte d'essai local : définir SEED_ADMIN_EMAIL et
# SEED_ADMIN_PASSWORD, puis lancer `npm run db:seed`.
npm run dev
```

Le schéma Prisma utilise actuellement SQLite. Ne pas déployer cette version sur plusieurs instances serverless : le passage à PostgreSQL et la création de migrations de production sont des prérequis.

---

## CI (GitHub Actions)

À chaque push / PR sur `main` :

1. `npm ci`
2. Prisma generate + db push (SQLite CI)
3. `tsc --noEmit`
4. `npm run lint`
5. `npm test`
6. `next build`
7. Artifact `.next`
8. `npm audit` (high+) en job parallèle

Workflows :

- [`.github/workflows/ci.yml`](.github/workflows/ci.yml) — build complet
- [`.github/workflows/deploy-preview.yml`](.github/workflows/deploy-preview.yml) — checklist secrets / fichiers

---

## Sécurité (résumé)

Voir [`docs/SECURITY.md`](docs/SECURITY.md).

- Rate-limit + lockout login
- Sanitisation entrées
- Headers CSP / XFO / nosniff
- Isolation `organizationId` sur agents, logs, escalades
- Secrets jamais dans le client

---

## Domaine métier

- [`docs/DOMAIN_LOGIC.md`](docs/DOMAIN_LOGIC.md) — découpage du monolithe
- [`docs/MESSAGE_PIPELINE.md`](docs/MESSAGE_PIPELINE.md) — pipeline message privé
- [`docs/PRODUCT.md`](docs/PRODUCT.md) — go/no-go produit

---

## Roadmap courte

1. ✅ Dashboard + multi-tenant + escalades + CI  
2. Worker Cloud API (webhook → pipeline → Gemini → reply)  
3. Pilote payant 3–5 écoles  
4. Flutter (mêmes API)  
