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
| Webhook Meta | verify token ; toujours répondre 200 contrôlé |
| IP | stockée uniquement sous hash |

## À faire avant production réelle

- [ ] `AUTH_SECRET` ≥ 32 octets aléatoires
- [ ] PostgreSQL + backups chiffrés
- [ ] Chiffrement applicatif des `cloudTokenEnc` (KMS ou libsodium)
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
