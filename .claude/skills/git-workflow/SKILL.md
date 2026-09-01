---
name: git-workflow
description: Structurer les branches et les commits sur LesCracks — modèle main/develop/feature, commits progressifs pendant le développement, format des messages. À utiliser avant de commencer à coder, avant tout commit, et avant d'ouvrir une PR.
---

# Branches et commits

## Avant d'écrire la première ligne

Vérifier où on est :
```
git branch --show-current
```

- Sur `main` ou `develop` → **créer une branche avant de modifier quoi que ce soit** :
  ```
  git switch develop && git pull
  git switch -c feature/event-waitlist
  ```
- Déjà sur une branche de travail cohérente avec la tâche → continuer dessus.

Préfixes : `feature/` (nouveauté), `fix/` (correctif), `docs/` (documentation, README, CLAUDE.md), `hotfix/` (urgence prod, part de `main`). Nom court, en anglais, en kebab-case.

Cible de la PR : `develop` — sauf `hotfix/`, qui vise `main`.

## Commiter progressivement

**Ne pas accumuler tout le travail dans un commit final.** Dès qu'un ensemble cohérent est terminé et vérifié, il est commité. Un découpage typique d'une feature backend + frontend :

```
feat(events): add waitlist columns          (migration Flyway + entité)
feat(events): expose waitlist in API        (DTO + service + controller + SecurityConfig)
feat(events): show waitlist state on detail (page + service front)
test(events): cover waitlist service        (tests)
```

Règles de découpage :
- Un commit = **un changement logique**, qui compile et laisse le projet dans un état sain
- Ne jamais mélanger dans un même commit : une feature et un refactoring, du code et du reformatage massif, deux sujets sans rapport
- Un renommage ou déplacement de fichiers va dans son propre commit
- Les modifications de dépendances (`pom.xml`, `package.json` + `pnpm-lock.yaml`) vont avec le code qui les utilise

Avant chaque commit, faire passer les checks de la partie touchée :
```
cd backend  && ./mvnw test
cd frontend && pnpm typecheck && pnpm lint
```

Toujours regarder ce qu'on s'apprête à inclure :
```
git status --short
git diff --staged
```
Stager explicitement (`git add <fichiers>`), jamais `git add -A` à l'aveugle : c'est ainsi qu'un `.env`, un dump ou un fichier temporaire finit dans l'historique.

## Format du message

```
type(scope): description à l'impératif, en anglais
```

`type` ∈ `feat`, `fix`, `refactor`, `docs`, `chore`, `test`.
`scope` = zone touchée (`events`, `seo`, `auth`, `admin`, `ci`…).

Corps de message optionnel, réservé au **pourquoi** et aux conséquences non évidentes (migration à appliquer, variable d'env à ajouter, comportement modifié). Pas de liste exhaustive des fichiers : le diff la donne déjà.

## Interdit dans les commits

- **Aucune mention de Claude, d'une IA ou d'un outil de génération.** Pas de trailer `Co-Authored-By: Claude ...`, pas de « Generated with … », pas d'allusion dans le corps ni dans la description de PR. L'auteur des commits est l'utilisateur.
- Pas de secret ni de `.env` (voir `.gitignore`).
- Pas de `git push --force`, pas de `git reset --hard` sur du travail partagé, pas de réécriture d'historique déjà poussé.
- Pas de commit direct sur `main` (hors `hotfix/` assumé) : `main` déclenche le déploiement en production.

## Avant la PR

```
git fetch origin && git rebase origin/develop
```
Relire l'ensemble de la branche pour vérifier qu'elle raconte une histoire lisible :
```
git log --oneline origin/develop..HEAD
```
