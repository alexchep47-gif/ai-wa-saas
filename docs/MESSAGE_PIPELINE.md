# Pipeline de traitement d’un message privé

Référence opérationnelle dérivée de `ai-wa-agent/index.js`.

## Entrée

Message WhatsApp (privé) reçu par le worker (Cloud API webhook ou Baileys `messages.upsert`).

## Étapes ordonnées

```
[1] Filtres
    - ignorer messages fromMe
    - ignorer status@broadcast / @newsletter (sauf publisher dédié)
    - ignorer groupes si policy agent.replyInGroups = false

[2] Normalisation
    - extractText (conversation, extendedText, caption image/vidéo/doc)
    - unwrap ephemeral / viewOnce
    - mediaType ∈ { none, image, video, document }

[3] Identité & langue
    - phone / jid → contactId
    - detectLang(text) → fr | en | null
    - mémoriser préférence langue par contact

[4] Autorisations
    - isAdmin(contact) ? → branche commandes admin
    - sinon utilisateur final

[5] Commandes admin (si admin)
    - ok|non <téléphone>     → valider / refuser dépôt
    - !maintenance on|off   → pause agent
    - !pause / !resume
    - !reponses / !reponse clé | texte
    - !reset [téléphone]
    - !journal
    - !statuts / programmation statut
    - !sondages on|off|status|aperçu   (expérimental canal)

[6] Mode pause
    - si agent.status = paused → ne pas répondre à l’utilisateur
      (sauf signalement dépôt éventuel vers admin)

[7] Réponses rapides
    - !tarifs | !inscription | !contact | clés custom
    - réponse fixe depuis Agent.quickReplies

[8] Escalade paiement
    - si isDepositClaim(text) → créer Escalation, notif admin, throttle 30 min

[9] Conversation IA
    - charger historique court (≤ 6 tours / contact)
    - systemPrompt de l’agent + contrainte « court, WhatsApp, français/anglais »
    - Gemini avec fallback de modèles
    - persister tours user/model

[10] Sortie
    - texte simple
    - ou PDF si wantsPdf(text) et réponse assez longue
    - ActivityLog : accepted | error

[11] Quotas
    - incrémenter messagesToday / messagesMonth
    - si quota dépassé → réponse polie + log warn (ne pas casser silencieusement)
```

## Sorties secondaires

| Événement | Action |
|-----------|--------|
| Claim dépôt | Notif admin + file d’attente |
| Erreur Gemini | Message utilisateur court + log error |
| Quota atteint | Message + log warn |
| Transfert humain demandé | Escalation + throttle |

## Ce que le dashboard doit afficher

- Derniers messages / volume du jour
- Escalades en attente
- Erreurs de connexion / rejet Meta
- Statut agent : draft | active | paused | error
