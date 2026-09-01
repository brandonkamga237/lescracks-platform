# LesCracks — Frontend

SPA React de la plateforme LesCracks, servie par Nginx en production.

Stack : React, TypeScript, Vite, Tailwind CSS, Radix UI, React Router, Framer Motion,
GSAP, Recharts. Les versions font foi dans `package.json`.

## Démarrer

**pnpm uniquement** — le lockfile du projet est `pnpm-lock.yaml`.

```bash
pnpm install
pnpm dev          # http://localhost:5173
pnpm typecheck    # tsc -b
pnpm lint         # eslint
pnpm build        # sortie dans dist/
```

L'API doit tourner sur `localhost:8080` : Vite proxifie `/api`, `/oauth2` et
`/login/oauth2` vers le backend, donc aucune variable d'environnement n'est
nécessaire en développement.

## Structure

```
src/
├── pages/          pages publiques ; pages/admin/ pour le back-office
├── components/
│   ├── ui/         primitives Radix + Tailwind
│   ├── layout/     layouts, dont AdminLayout
│   ├── landing/    sections de la page d'accueil
│   ├── cards/      cartes réutilisables
│   ├── resources/  affichage des ressources
│   ├── admin/      composants du back-office
│   ├── common/     transverses, dont SEO
│   └── icons/
├── services/       api.ts, publicApi.ts, adminApi.ts, auth.ts
├── contexts/       AuthContext, ThemeContext
├── hooks/          useXxx
├── config/env.ts   lecture des variables Vite
├── lib/            utilitaires
├── data/           données statiques
└── utils/
```

## Conventions

- **Imports par alias `@/`** — jamais de chemins relatifs profonds.
- **Aucun `fetch` dans un composant.** Tout appel API passe par `src/services/` :
  - `publicApi.ts` — endpoints publics, sans token
  - `api.ts` — endpoints authentifiés (JWT)
  - `adminApi.ts` — endpoints `/api/admin`
- **Aucune URL d'API en dur** : la base vient de `ENV.API_BASE_URL` (`src/config/env.ts`).
- Tailwind pour le style, pas de styles inline. Thème clair/sombre via `ThemeContext`
  et les variantes `dark:`.
- Props typées : `interface {ComponentName}Props`.
- Pages en PascalCase, hooks en `useXxx`.
- Code, identifiants et commentaires en anglais ; seuls les textes affichés sont
  en français.

## SEO

Chaque page publique monte le composant `SEO` :

```tsx
import SEO from '@/components/common/SEO';

<SEO title="Titre" description="…" url="/ma-page" />
```

Le site étant rendu côté client, les crawlers qui n'exécutent pas JavaScript ne
voient rien. `nginx.conf` détecte les user-agents de bots et les redirige vers des
snapshots HTML rendus par le backend, pendant que les humains reçoivent la SPA.

Ajouter une page publique indexable demande donc aussi une entrée dans la map
`$seo_page` de `nginx.conf`, un rendu dans `SeoController` et une URL dans
`SitemapController` côté backend.

## Variables d'environnement

| Variable | Défaut | Rôle |
|---|---|---|
| `VITE_API_BASE_URL` | `/api` | Base des appels API |

En développement comme en production le défaut suffit : le proxy Vite d'un côté,
Nginx de l'autre, servent l'API sous le même domaine.

## Build et production

`pnpm build` produit `dist/`. Le `Dockerfile` construit l'image et sert le résultat
avec Nginx, en appliquant `nginx.conf` (routage SPA, proxy `/api`, redirection des
bots vers les snapshots SEO). Le TLS, le domaine et la redirection `www` vers l'apex
sont gérés en amont par Traefik, via les labels de `docker-compose.prod.yml`.
