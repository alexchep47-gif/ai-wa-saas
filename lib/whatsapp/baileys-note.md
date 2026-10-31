# Baileys — usage prototype uniquement

Le dépôt monolithique [ai-wa-agent](https://github.com/alexchep47-gif/ai-wa-agent) utilise `@whiskeysockets/baileys`.

## Pourquoi ce n’est pas la voie commerciale

- Reproduit le comportement de WhatsApp Web.
- Expose chaque client aux déconnexions (Bad MAC, etc.).
- Risque de blocage ou de changement de protocole.
- Sessions à gérer et à sauvegarder par client → complexité et surface d’attaque élevées.

## Règle produit

- **Prototype privé / interne** : OK.
- **Offre vendue aux écoles** : uniquement WhatsApp Cloud API (officielle).

## Publication dans les chaînes

La Cloud API documente les messages utilisateurs, appels et groupes.
Elle **ne documente pas** la publication dans les chaînes WhatsApp.
Une réponse de la communauté Meta indique que ce n’est pas supporté.

→ Traiter la publication automatique en chaîne comme **expérimentale**.
→ Proposer d’abord un calendrier de publications à copier manuellement.
