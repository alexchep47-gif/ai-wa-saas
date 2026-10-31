# Logique métier extraite de `ai-wa-agent`

Analyse du monolithe Baileys actuel et découpage propre pour le SaaS multi-tenant.

---

## 1. Ce que fait réellement le bot aujourd’hui

Le fichier `index.js` (~45 ko) mélange **connexion**, **conversation**, **admin**, **paiements**, **statuts** et **publications canal**. Voici les domaines séparés.

### A. Connexion WhatsApp (Baileys)

| Élément | Comportement |
|--------|--------------|
| Auth | `useMultiFileAuthState('auth_info')` — fichiers locaux |
| Pairing | Code 8 caractères via `requestPairingCode(OWNER)` |
| Reconnect | Sur close (sauf 401/440 logout) ; status 515 → re-pair |
| Santé | Express sur `PORT`, flag `waReady` |

**Problème SaaS** : une session Baileys = un processus + disque persistant. Impossible de mettre ça dans le dashboard mobile/web. → Worker dédié par agent (ou pool), sessions chiffrées hors dashboard.

### B. Messages privés (cœur commercial)

Pipeline à chaque message entrant :

```
1. Ignorer fromMe, broadcast, groupes (sauf REPLY_IN_GROUPS)
2. Extraire texte / média (y compris ephemeral & viewOnce)
3. Détecter langue (fr/en) et mémoriser par JID
4. Si expéditeur admin → commandes admin / validation dépôt
5. Si !tarifs / !inscription / !contact → réponse rapide
6. Si maintenance → silence (sauf dépôts signalés)
7. Si claim paiement → file pendingDeposits + notif admin
8. Sinon → Gemini (historique court 6 tours) → réponse texte
9. Option PDF si le message demande une fiche
```

**Mémoire** : `conversationHistory` Map en RAM (perdue au redémarrage).  
**Quick replies** : objet mutable + persisté dans `bot_state.json`.

### C. Escalade humaine & dépôts

- Détection regex : « j’ai payé », « dépôt », « momo », etc.
- `pendingDeposits` Map téléphone → { jid, text, at }
- Admin répond `ok 2376…` / `non 2376…`
- Throttle escalation : 1 notif / contact / 30 min
- Journal admin : 100 derniers événements

### D. Statuts WhatsApp

- Commandes : `statut: …`, `statut connus:`, `statut liste:`, `statut dans 15m:`
- Aperçu obligatoire → `confirmer statut` / `annuler`
- Audience : contacts ayant déjà écrit (`statusRecipients`) ou liste env
- Médias image/vidéo (limite 64 Mo, vidéo ≤ 90 s WhatsApp)
- File programmée avec timers + persistance

### E. Canal Mathsfor.all (expérimental)

- Résolution JID via `newsletterMetadata('invite', code)`
- Autorisation : rôle ADMIN/OWNER **ou** numéro lié ∈ `ADMIN_NUMBERS`
- 5 publications / jour (quiz / poll / question natifs protobuf)
- Génération Gemini + banque de secours (`FALLBACK_BANK`)
- Corrigé + liens sociaux 30 min après le dernier
- Abandon si retard > 15 min (évite flood au redémarrage)
- Activation explicite : `!sondages on`

**Verdict produit** : utile en prototype privé ; **ne pas vendre** tant qu’il n’y a pas d’API officielle chaînes.

### F. État runtime persisté

Fichier `data/bot_state.json` :

- `quickReplies`, `maintenanceMode`
- `statusRecipients`, `scheduledStatuses`
- `channelPollsEnabled`, `scheduledPollJobs`, `publishedQuizAnswers`
- `adminEvents`

Sur hébergement éphémère → volume persistant obligatoire.

---

## 2. Découpage logique pour le SaaS

Chaque **Organisation** (école) possède N **Agents**.  
Chaque Agent a une config isolée et un worker de connexion.

```
┌─────────────────────────────────────────────────────────┐
│  DASHBOARD (Next.js) — config & supervision uniquement  │
│  • Comptes / rôles                                      │
│  • Prompt, réponses rapides, FAQ                        │
│  • Stats, journaux, abonnement                          │
│  • Assistant connexion Cloud API (guidé)                │
│  ✗ Jamais de clé Gemini ni session WhatsApp             │
└──────────────────────────┬──────────────────────────────┘
                           │ API interne authentifiée
┌──────────────────────────▼──────────────────────────────┐
│  BACKEND / CONTROL PLANE                                │
│  • Multi-tenant DB (Prisma)                             │
│  • Chiffrement secrets (Cloud token, etc.)              │
│  • Quotas messages / agents                             │
│  • Webhooks Meta → routage vers le bon agent            │
└──────────────────────────┬──────────────────────────────┘
                           │
          ┌────────────────┼────────────────┐
          ▼                ▼                ▼
   ┌────────────┐   ┌────────────┐   ┌────────────┐
   │ Worker A   │   │ Worker B   │   │ Scheduler  │
   │ Cloud API  │   │ Baileys*   │   │ jobs       │
   │ (prod)     │   │ (proto)    │   │            │
   └────────────┘   └────────────┘   └────────────┘
```

\* Baileys uniquement en mode prototype / compte interne.

### Modules à extraire du monolithe

| Module monolithe | Module SaaS | Priorité pilote |
|------------------|-------------|-----------------|
| `askAI` + history | `ConversationService` | **P0** |
| `quickReplies` | Config agent (déjà dans dashboard) | **P0** |
| `pendingDeposits` + admin decision | `EscalationService` | **P0** |
| `maintenanceMode` | Flag agent `status=paused` | **P0** |
| `logAdminEvent` | `ActivityLog` (déjà en DB) | **P0** |
| Connexion Baileys | `BaileysWorker` (optionnel) | P2 |
| Cloud API send/receive | `CloudApiWorker` | **P1** |
| Statuts programmés | `StatusScheduler` | P2 |
| Sondages canal | `ChannelPublisher` | **P3 — expérimental** |
| PDF | `DocumentService` | P2 |

### Flux message privé (cible Cloud API)

```
Meta webhook
  → identifier phone_number_id → Agent
  → vérifier plan / quota / status ≠ paused
  → si commande rapide connue → répondre template/text
  → si claim paiement → EscalationService + notif admin
  → sinon ConversationService (prompt agent + historique DB)
  → Gemini côté serveur uniquement
  → sendTextMessage Cloud API
  → ActivityLog (accepté / rejeté / en attente)
```

### Ce qui reste volontairement hors scope pilote

1. Publication automatique dans les chaînes (pas d’API officielle).
2. Multi-agents Baileys concurrent sur le même process.
3. Paiement in-app Apple/Google (plus tard, apps mobiles).
4. « Illimité » messages / tokens.

---

## 3. Mapping config monolithe → schéma Prisma

| Env / state actuel | Champ SaaS |
|--------------------|------------|
| `SYSTEM_PROMPT` | `Agent.systemPrompt` |
| `BOT_NAME` | `Agent.name` |
| `quickReplies` | `Agent.quickReplies` (JSON) |
| `maintenanceMode` | `Agent.status = paused` |
| `ADMIN_NUMBERS` | Memberships role=admin + numéros notif |
| `OWNER_NUMBER` | lié au compte Cloud / pairing proto |
| `WHATSAPP_CHANNEL_URL` | option expérimentale agent |
| `POLL_TIMES` | config scheduler (plus tard) |
| `GEMINI_API_KEY` | secret serveur global ou par org (chiffré) |
| historique conversation | table `ConversationTurn` (à ajouter) |
| `pendingDeposits` | table `Escalation` |
| `adminEvents` | `ActivityLog` |

---

## 4. Ordre d’implémentation recommandé

1. **Dashboard config** (fait) — prompt, réponses rapides, pause, logs.
2. **Tables conversation + escalation** — persister ce qui est en RAM aujourd’hui.
3. **Worker Cloud API** — webhook + envoi + Gemini + quotas.
4. **Validation Meta** pour le cas éducatif (go/no-go n°1).
5. **Pilote 3–5 écoles** payant (go/no-go n°2).
6. Baileys worker isolé seulement si besoin interne.
7. Flutter en miroir du dashboard web.

---

## 5. Règles dures (ne pas casser)

- Une app mobile **ne doit jamais** héberger la session WhatsApp 24/7.
- Les clés IA et tokens Cloud **restent côté serveur**.
- Ne pas promettre la publication en chaîne.
- Ne pas présenter Baileys comme connexion commerciale garantie.
- Toujours pouvoir **désactiver** un agent (pause) sans supprimer la config.
- Journaux clairs : message accepté / rejeté / en attente / erreur.
