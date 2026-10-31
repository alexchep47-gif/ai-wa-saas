# WhatsApp — règles et coûts

## Cloud API (voie recommandée)

- Documentation officielle : [WhatsApp Business Platform](https://developers.facebook.com/docs/whatsapp)
- Le webhook vérifie `X-Hub-Signature-256` avec `META_APP_SECRET`; le challenge GET exige `WHATSAPP_VERIFY_TOKEN`.
- Chaque agent doit avoir un `Phone Number ID` et son propre jeton, saisis dans son formulaire de configuration. Le jeton est chiffré AES-256-GCM avec `WHATSAPP_TOKEN_ENCRYPTION_KEY`.
- Les événements ne sont routés que si leur `phone_number_id` correspond exactement à un agent configuré; le webhook ne choisit jamais un agent au hasard.
- La version Graph API est configurable avec `META_GRAPH_API_VERSION` (défaut actuel : `v26.0`; [versions Meta](https://developers.facebook.com/docs/graph-api/changelog/versions/)).
- Messages hors fenêtre de service 24 h : templates pré-approuvés
- Catégories de messages et tarification selon le pays du destinataire
- Conditions relatives aux fournisseurs IA : vérifier les règles Meta actuelles

## Chaînes (Channels)

- Non documenté pour la publication automatisée dans la Cloud API
- Réponse communauté Meta : non supporté
- Traitement : fonction expérimentale ou calendrier manuel

## Baileys

Voir `lib/whatsapp/baileys-note.md`.
Réservé au prototype privé.

## Consentement & confidentialité

Les conversations envoyées à Gemini (ou autre) doivent être expliquées aux clients.
Apple exige d’indiquer le partage avec des services d’IA tiers et d’obtenir le consentement.
