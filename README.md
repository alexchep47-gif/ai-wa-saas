# AI WA SaaS — Agents WhatsApp éducatifs multi-tenant

**Produit** : service SaaS pour établissements scolaires et services éducatifs au Cameroun.
L’application (web d’abord, puis Flutter) sert à **configurer et surveiller** l’agent.
Les agents tournent **24 h/24 sur un serveur**, jamais uniquement dans une app mobile.

Premier cas pilote : **CMR SCHOOL / Mathsfor.all**.

> Version actuelle du bot monolithique (Baileys) : [ai-wa-agent](https://github.com/alexchep47-gif/ai-wa-agent).
> Ce dépôt le transforme en architecture SaaS propre.

---

## Architecture cible (respectée)

| Couche | Rôle |
|--------|------|
| **Dashboard web adaptatif** (Next.js) | Création de compte, assistant de configuration, prompt, réponses rapides, stats, journaux, admins, abonnement |
| **Backend / API** | Comptes, permissions, abonnements, isolation multi-tenant |
| **Base de données** | Paramètres et données isolés par client (Prisma) |
| **Workers** | Connexions WhatsApp autorisées + tâches planifiées (séparés du dashboard) |
| **Clés & sessions** | Chiffrées, jamais dans le client mobile/web |

Le dashboard **ne contient jamais** de clé Gemini ni de session WhatsApp.

### Connexion WhatsApp

| Mode | Statut | Usage |
|------|--------|-------|
| **WhatsApp Cloud API (officielle)** | Cible commerciale | Messages privés, fiable, facturée par Meta |
| **Baileys (Web)** | Prototype privé uniquement | Ne pas vendre comme connexion garantie |
| **Publication dans les chaînes** | Expérimental / manuel | Pas d’API officielle documentée → calendrier à copier manuellement pour l’instant |

Voir la documentation Meta et la réponse de la communauté sur les chaînes.

---

## Stack technique (MVP pilote)

- **Frontend + API** : Next.js 15 (App Router) + Tailwind + shadcn/ui style
- **ORM** : Prisma
- **DB** : SQLite (dev) → PostgreSQL (prod)
- **Auth** : simple email + mot de passe (session cookie) pour le pilote
- **Déploiement** : Vercel (dashboard) + worker séparé plus tard (Railway / Render)

---

## Démarrage local

```bash
npm install
cp .env.example .env
npx prisma db push
npm run dev
```

Ouvre http://localhost:3000

Compte démo créé automatiquement au premier démarrage si la base est vide (voir `prisma/seed.ts`).

---

## Structure du dépôt

```
ai-wa-saas/
├── app/                    # Next.js App Router
│   ├── (auth)/             # login / register
│   ├── (dashboard)/        # tableau de bord isolé par tenant
│   │   ├── agents/
│   │   ├── settings/
│   │   ├── logs/
│   │   └── billing/
│   └── api/                # routes API
├── lib/
│   ├── auth.ts
│   ├── prisma.ts
│   └── whatsapp/           # stubs Cloud API + notes Baileys
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── components/
└── docs/
    ├── PRODUCT.md          # vision produit & go/no-go
    └── WHATSAPP.md         # règles Cloud API, coûts, chaînes
```

---

## Plan d’attaque (rappel)

1. Valider la demande avec quelques écoles (messages privés d’abord).
2. Pilote web payant (ce dépôt).
3. Sécuriser / faire valider la connexion Cloud API pour le cas éducatif.
4. Abonnement avec essai + forfaits limités (pas d’illimité au départ).
5. Bêta limitée → apps Flutter Android/iOS.

**Premier go/no-go** : connexion WhatsApp commerciale autorisée et exploitable.
**Deuxième** : prouver que des clients paient et renouvellent.

---

## Licence & confidentialité

Code propriétaire pour l’instant.  
Les données de conversation envoyées à un fournisseur IA (Gemini, etc.) doivent être expliquées aux clients et le consentement obtenu (règles Apple notamment).
