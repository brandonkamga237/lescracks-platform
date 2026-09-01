---
name: seo-page
description: Rendre une page publique visible des crawlers et moteurs génératifs (Google, GPTBot, ClaudeBot…) via un snapshot HTML serveur. À utiliser dès qu'on ajoute une page publique indexable ou un nouveau type de contenu à slug.
---

# Snapshot SEO pour les bots

## Pourquoi

Le site est une SPA rendue côté client : un crawler qui n'exécute pas JS reçoit une coquille vide sur toutes les routes internes. La parade en place : **nginx détecte les user-agents de bots et les renvoie vers un snapshot HTML rendu par le backend**, pendant que les humains reçoivent la SPA normale.

Une page publique n'est donc réellement indexable que si les **trois** points ci-dessous sont faits. En oublier un donne une page invisible des moteurs, sans aucune erreur visible.

## 1. Snapshot backend — `controller/SeoController.java`

- Route sous `/seo` (hors `/api`), déjà `permitAll` via `.requestMatchers(HttpMethod.GET, "/seo/**")`.
- Retourner un document HTML complet : `<title>`, `<meta name="description">`, balises OG, contenu textuel réel, et un bloc JSON-LD schema.org adapté au type (`Event`, `Article`, `Person`, `Organization`…).
- Le contenu vient de la base via les repositories, pas de texte figé.
- Pages statiques marketing → `/seo/pages/{nom}` ; pages de détail → `/seo/{type}/{slug}`.

## 2. Routage nginx — `frontend/nginx.conf`

- **Page marketing statique** : ajouter une entrée dans la map `$seo_page` :
  ```nginx
  "1:/ma-page"  "ma-page";
  ```
  (la clé combine le flag bot et le chemin ; `location /` fait le `rewrite` vers `/_seo/pages/$seo_page`).
- **Nouveau type de page de détail à slug** : l'ajouter au groupe nommé de la `location` regex existante (`evenements|ressources|apprenants`).
- Le bloc `location ^~ /_seo/` est interne et proxifie vers le backend : ne pas y toucher.

## 3. Sitemap — `controller/SitemapController.java`

Ajouter l'URL dans le sitemap, avec une `priority` cohérente avec les existantes. Les pages à slug sont générées en boucle depuis la base ; une page statique s'ajoute à la main.

## Côté SPA

La page React garde son composant `SEO` (voir le skill `frontend-page`) : c'est ce que voient les humains et les crawlers qui exécutent JS.

## Vérifier

Simuler un bot en local (backend démarré) :
```
curl -s http://localhost:8080/seo/pages/ma-page | head -40
```
En prod, à travers nginx :
```
curl -s -A "ClaudeBot" https://lescracks.com/ma-page | head -40
```
Un humain doit continuer à recevoir la SPA :
```
curl -s https://lescracks.com/ma-page | grep -c "<div id=\"root\">"
```
