---
name: frontend-page
description: Créer ou modifier une page ou un composant du frontend LesCracks (React + Vite + Tailwind) en respectant le routage, la couche services et les conventions du projet. À utiliser pour toute nouvelle page, route ou écran admin.
---

# Ajouter une page

## Emplacements

- Page publique → `src/pages/Xxx.tsx` (PascalCase)
- Page admin → `src/pages/admin/AdminXxx.tsx`, rendue dans `AdminLayout`
- Composant réutilisable → `src/components/{landing,cards,resources,admin,layout,common}/`
- Primitive UI (Radix + Tailwind) → `src/components/ui/`
- Hook → `src/hooks/useXxx.ts`

La route se déclare dans `src/App.tsx` (import + `<Route>`). Les pages admin sont sous le layout admin et protégées côté client par `useAdminAuth`.

## Conventions non négociables

- **Imports par alias `@/`** — jamais de `../../..`.
- **Aucun `fetch` dans un composant.** Tout appel API passe par `src/services/` :
  - `publicApi.ts` → endpoints publics, sans token
  - `api.ts` → endpoints authentifiés (JWT)
  - `adminApi.ts` → endpoints `/api/admin`
  Ajouter la méthode dans le service, avec son type TypeScript exporté, puis l'appeler depuis la page.
- **Jamais d'URL d'API en dur** : la base vient de `ENV.API_BASE_URL` (`src/config/env.ts`), déjà utilisée par les services.
- **Tailwind uniquement**, pas de styles inline ni de CSS ad hoc.
- **Props typées** : `interface XxxProps { ... }`.
- **Textes en français** (le site est francophone).
- Thème clair/sombre via `ThemeContext` : utiliser les classes `dark:` plutôt qu'une couleur figée.
- État d'auth via `useAuth()` (`AuthContext`), jamais en lisant le token directement.

## SEO — obligatoire sur une page publique

Monter le composant `SEO` (`@/components/common/SEO`) en haut de la page :
```tsx
<SEO title="Titre de la page" description="..." url="/ma-page" />
```
Il met à jour `document.title` et les balises meta/OG déjà présentes dans `index.html`.

**Une page publique indexable ne s'arrête pas là** : le site est une SPA, les crawlers sans JS ne voient rien. Il faut aussi un snapshot serveur → voir le skill `seo-page`.

## Vérification
```
cd frontend && pnpm typecheck && pnpm lint
```
`pnpm` uniquement, jamais `npm` (le lockfile du projet est `pnpm-lock.yaml`).
