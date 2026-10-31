# Sécurité — AI WA SaaS

## Principes

1. **Moindre privilège** — le dashboard n'a jamais les sessions WhatsApp ni les clés Gemini en clair.
2. **Isolation multi-tenant** — toute requête agent/log filtre par `organizationId` du membership.
3. **Secrets serveur uniquement** — `AUTH_SECRET`, tokens Cloud, `GEMINI_API_KEY` hors client.
4. **Pas de stack trace** exposée en production.
5. **Sessions** — JWT httpOnly + token hashé en base ; révocation possible.

## Contrôles implémentés

| Contrôle | Détail |
|----------|--------|
| Mots de passe | bcrypt cost 12, politique min 8 + lettre + chiffre |
| Sessions | 14 j, httpOnly, Secure en prod, SameSite=Lax |
| Rate limit login | DB bucket par email (5 / 15 min) |
| Lockout | `failedLogins` + `lockedUntil` |
| Headers | CSP, X-Frame-Options DENY, nosniff, Referrer-Policy |
| `poweredByHeader` | désactivé |
| Sanitisation | textes, prompts, emails, téléphones |
| Webhook Meta | HMAC-SHA256 sur le corps brut ; fail closed sans `META_APP_SECRET` |
| Jeton WhatsApp | AES-256-GCM par agent ; la clé reste dans les secrets du serveur |
| Routage tenant | `phone_number_id` doit correspondre exactement à un agent configuré ; aucun agent « dernier actif » par défaut |
| IP | stockée uniquement sous hash |

## À faire avant production réelle

- [ ] `AUTH_SECRET` ≥ 32 octets aléatoires
- [ ] `AUTH_SECRET` ≥ 32 octets aléatoires
- [ ] PostgreSQL + migrations et backups chiffrés (le prototype utilise encore SQLite)
- [ ] Traiter l’avis npm high restant dans `prisma` / `@prisma/config` (migration Prisma compatible, puis nouvel audit)
- [ ] Rotation documentée de `WHATSAPP_TOKEN_ENCRYPTION_KEY` avec rechiffrement des jetons
- [ ] CSP avec nonces (supprimer unsafe-inline)
- [ ] WAF / rate limit edge (Vercel firewall)
- [ ] Journal d'audit immuable pour actions admin
- [ ] Politique de conservation des ConversationTurn
- [ ] Tests de pénétration basiques (authz multi-tenant)

## Surface d'attaque WhatsApp

- **Cloud API** : tokens Meta, webhooks signés — voie recommandée.
- **Baileys** : session Web, Bad MAC, ban risk — prototype privé seulement, jamais multi-client commercial.

## Données personnelles (Cameroun / RGPD-like)

- Expliquer aux clients l'envoi de messages à un LLM tiers.
- Droit de suppression de compte (à brancher).
- Minimiser : historique conversation tronqué (20 tours max / contact).
