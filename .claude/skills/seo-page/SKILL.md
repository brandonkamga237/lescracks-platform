---
name: seo-page
description: Make a public page visible to crawlers and generative engines (Google, GPTBot, ClaudeBot…) through a server-rendered HTML snapshot. Use whenever an indexable public page or a new slug-based content type is added.
---

# SEO snapshot for bots

## Why

The site is a client-rendered SPA: a crawler that does not execute JavaScript
receives an empty shell on every internal route. The countermeasure in place:
**nginx detects bot user-agents and routes them to an HTML snapshot rendered by the
backend**, while humans get the normal SPA.

A public page is therefore only really indexable once all **three** points below are
done. Missing one leaves the page invisible to engines, with no visible error.

## 1. Backend snapshot — `controller/SeoController.java`

- Route under `/seo` (outside `/api`), already `permitAll` through
  `.requestMatchers(HttpMethod.GET, "/seo/**")`.
- Return a complete HTML document: `<title>`, `<meta name="description">`, OG tags,
  real textual content, and a schema.org JSON-LD block matching the type (`Event`,
  `Article`, `Person`, `Organization`, …).
- The content comes from the database through the repositories, never hardcoded text.
- Static marketing pages → `/seo/pages/{name}`; detail pages → `/seo/{type}/{slug}`.

## 2. nginx routing — `frontend/nginx.conf`

- **Static marketing page**: add an entry to the `$seo_page` map:
  ```nginx
  "1:/my-page"  "my-page";
  ```
  (the key combines the bot flag and the path; `location /` does the `rewrite` to
  `/_seo/pages/$seo_page`).
- **New slug-based detail type**: add it to the named group of the existing regex
  `location` (`evenements|ressources|apprenants`).
- The `location ^~ /_seo/` block is internal and proxies to the backend: leave it alone.

## 3. Sitemap — `controller/SitemapController.java`

Add the URL to the sitemap with a `priority` consistent with the existing ones.
Slug-based pages are generated in a loop from the database; a static page is added by
hand.

## On the SPA side

The React page keeps its `SEO` component (see the `frontend-page` skill): that is what
humans and JavaScript-capable crawlers see.

## Verify

Simulate a bot locally (backend running):
```
curl -s http://localhost:8080/seo/pages/my-page | head -40
```
In production, through nginx:
```
curl -s -A "ClaudeBot" https://lescracks.com/my-page | head -40
```
A human must still get the SPA:
```
curl -s https://lescracks.com/my-page | grep -c "<div id=\"root\">"
```
