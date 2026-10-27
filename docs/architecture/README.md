# LesCracks architecture

How the platform is built **today** (October 2026, release after V40), drawn from the code
rather than from intentions. Every diagram is Mermaid, so GitHub renders it and a pull request
that changes the system can change its picture in the same diff.

- The rules every change must follow: [`.claude/skills/design-patterns/SKILL.md`](../../.claude/skills/design-patterns/SKILL.md)
- How well the code follows them, measured: [design-audit.md](design-audit.md)
- The complete database schema: [database.md](database.md), [schema.sql](schema.sql)

Contents

1. [System context](#1-system-context)
2. [Containers and deployment](#2-containers-and-deployment)
3. [How a request travels](#3-how-a-request-travels)
4. [Backend modules](#4-backend-modules)
5. [Inside a module: ports and adapters](#5-inside-a-module-ports-and-adapters)
6. [Authentication](#6-authentication)
7. [Key flows](#7-key-flows)
8. [Data model](#8-data-model)
9. [Frontend](#9-frontend)
10. [Delivery pipeline](#10-delivery-pipeline)
11. [Observability](#11-observability)

---

## 1. System context

Who uses the platform and which outside systems it depends on.

```mermaid
flowchart LR
    visitor([Visitor<br/>reads the blog, events, Talk])
    member([Member<br/>signs up, registers, comments, submits projects])
    admin([Admin<br/>writes, schedules, moderates, awards])
    bot([Crawlers and link previews<br/>Google, GPTBot, WhatsApp…])

    platform[[LesCracks platform<br/>lescracks.com]]

    keycloak[(Keycloak<br/>Google / GitHub sign-in)]
    smtp[(SMTP server<br/>transactional + newsletter email)]
    youtube[(YouTube<br/>Talk episodes)]
    umami[(Umami<br/>privacy-friendly web analytics)]

    visitor --> platform
    member --> platform
    admin --> platform
    bot -->|server-rendered snapshots| platform
    platform -->|verifies tokens| keycloak
    member -.->|OIDC redirect| keycloak
    platform -->|sends| smtp
    platform -->|embeds| youtube
    platform -->|audience stats API| umami
```

## 2. Containers and deployment

One VPS, one Docker Compose file per environment (`docker-compose.prod.yml`), Traefik in front
(TLS via Let's Encrypt). Everything except the routed services lives on the private
`lescracks-internal` network.

```mermaid
flowchart TB
    internet((Internet))

    subgraph vps[VPS]
        traefik[Traefik<br/>TLS, host routing<br/>network traefik-public]

        subgraph routed[Routed by Traefik]
            frontend[frontend<br/>nginx + React SPA<br/>lescracks.com]
            backend[backend<br/>Spring Boot 3, Java 21<br/>api.lescracks.com, port 8080<br/>actuator on 9090, never routed]
            keycloak[keycloak<br/>auth.lescracks.com]
            minio[minio console<br/>minio.lescracks.com]
            grafana[grafana<br/>grafana.lescracks.com]
            umami[umami<br/>umami.lescracks.com]
        end

        subgraph internal[lescracks-internal only]
            postgres[(PostgreSQL 16<br/>databases: lescracks, keycloak, umami)]
            minioapi[(MinIO S3 API<br/>uploaded images)]
            prometheus[Prometheus]
            loki[Loki]
            promtail[Promtail]
            exporters[postgres-exporter<br/>node-exporter, cAdvisor<br/>blackbox]
        end
    end

    internet --> traefik
    traefik --> frontend & backend & keycloak & minio & grafana & umami
    frontend -->|/api, /_seo, /sitemap.xml| backend
    backend --> postgres
    backend --> minioapi
    backend -->|JWKS| keycloak
    backend -->|stats API| umami
    keycloak --> postgres
    umami --> postgres
    promtail -->|backend log files| loki
    prometheus -->|scrapes| backend & exporters & keycloak
    grafana --> prometheus & loki
```

| Container | Image tag | State it owns |
| --- | --- | --- |
| frontend, backend | `brandoniscoding/*:${IMAGE_TAG}` (release version) | none |
| postgres | `postgres:16-alpine` | volume `lescracks_postgres_data` |
| minio | `minio/minio:latest` (unpinned, see audit) | volume `lescracks_minio_data` |
| keycloak | `quay.io/keycloak/keycloak:26.0` | its own database in postgres |
| prometheus, loki, grafana | pinned versions | their volumes |

## 3. How a request travels

The SPA calls the API **on its own origin** (`/api`, `ENV.API_BASE_URL`), so the session cookie
is first-party. nginx also decides, per user agent, whether a page is served as the SPA or as a
server-rendered snapshot.

```mermaid
flowchart TB
    req[GET lescracks.com/path] --> traefik[Traefik]
    traefik --> nginx[nginx in the frontend container]

    nginx --> isApi{"/api/* ?"}
    isApi -->|yes| api[proxy to backend:8080/api]
    isApi -->|no| isSitemap{"/sitemap.xml ?"}
    isSitemap -->|yes| sitemap[proxy to backend /api/sitemap.xml]
    isSitemap -->|no| isLegacy{"/ressources/... ?"}
    isLegacy -->|yes| redirect[301 to /blog or /blog/slug]
    isLegacy -->|no| isBot{"user agent matches<br/>$is_seo_bot ?"}
    isBot -->|"yes, /blog/slug or /evenements/slug"| detail[backend /seo/blog/slug<br/>or /seo/evenements/slug]
    isBot -->|yes, static marketing page| page[backend /seo/pages/name]
    isBot -->|no| spa[index.html: the SPA routes in the browser]
```

## 4. Backend modules

One package per business capability (`backend/src/main/java/com/brandonkamga/lescracks/`).
The arrows are **real compile-time dependencies**, measured from the imports; `shared` is left
out because every module uses it. The graph has no cycle, and `ArchitectureTest` keeps it so.

```mermaid
flowchart LR
    classDef migrated fill:#1f3d2b,stroke:#3fa66b,color:#fff
    classDef legacy fill:#4a2a12,stroke:#d4af37,color:#fff
    classDef tech fill:#2a2a2a,stroke:#888,color:#fff

    account[account]:::migrated
    member[member]:::migrated
    newsletter[newsletter]:::migrated
    taxonomy[taxonomy]:::migrated
    content[content]:::migrated
    event[event]:::migrated
    engagement[engagement]:::migrated
    recognition[recognition]:::migrated

    community[community]:::legacy
    stats[stats]:::legacy
    mail[mail]:::legacy
    seo[seo]:::legacy
    storage[storage]:::tech

    member --> account & taxonomy & storage
    newsletter --> account & mail
    account --> mail
    content --> taxonomy & engagement & newsletter & storage
    event --> member & engagement & newsletter & storage
    engagement --> member & mail & storage
    recognition --> event & member & mail
    community --> member & event & recognition & engagement & storage
    stats --> account & member & content & event & engagement & newsletter & taxonomy
    seo --> content & event
```

Green: on the target skeleton and checked by `ArchitectureTest`. Brown: not migrated yet
(`community`, `stats` → `analytics`, `mail` → `notification`, `seo`). Grey: technical module.

| Module | Owns (tables) | Exposes to other modules | HTTP routes |
| --- | --- | --- | --- |
| `account` | `accounts`, `account_identities`, `account_tokens`, `admins`, `spring_session*` | `AccountDirectory`, `AccountStatistics`, event `AccountRegistered` | `/api/auth/**`, `/api/me` (password, verification, delete), `/api/me/identities`, `/api/admin/auth/**`, `/api/admin/admins` |
| `member` | `member_profiles`, `member_interests` | `MemberDirectory`, `MemberStatistics` | `/api/me` (profile, onboarding, avatar), `/api/oidc/sync`, `/api/admin/users/**` |
| `newsletter` | `newsletter_subscribers`, `newsletter_campaigns` | `Announcements`, `NewsletterStatistics` | `/api/newsletter/**` |
| `taxonomy` | `categories` (themes), `tags` | `TaxonomyService` | `/api/categories`, `/api/tags`, `/api/admin/{categories,tags}` |
| `content` | `articles`, `article_tags`, `talk_videos` | `ArticleCatalog`, `ContentStatistics`, `ContentTargets` | `/api/resources/**`, `/api/talks/**` |
| `event` | `events`, `event_registrations`, `event_submissions`, `event_submission_members` | `EventCatalog`, `EventDirectory`, `RegistrationService`, `SubmissionService`, `EventStatistics` | `/api/events/**` |
| `engagement` | `content_views`, `content_likes`, `engagement_counters`, `comments`, `comment_reports` | `EngagementCounts`, `CommentService` | `/api/resources/{id}/{views,likes,comments}`, `/api/events/{id}/views`, `/api/comments/**` |
| `recognition` | `badges`, `member_badges`, `certificates` | `BadgeService`, `CertificateService`, event `CertificateIssued` | `/api/badges/**`, `/api/certificates/**` |
| `community` | none (reads others) | — | `/api/members/{id}`, `/api/admin/users/{id}/activity` |
| `stats` | none (reads others + Umami) | — | `/api/admin/stats/**` |
| `mail` | none | `Mailer` + one record per email | — |
| `storage` | MinIO bucket | `StorageService`, `CoverImages` | `/api/files/{key}`, `/api/admin/upload/image` |
| `seo` | none (reads others) | — | `/seo/**`, `/api/sitemap.xml` |
| `shared` | — | paging, errors, slugs, CSV, visitor keys, publication scheduler, transactions, security chain | — |

Leftover tables nobody reads: `cracklab_*` (CrackLab was removed; kept on purpose).

## 5. Inside a module: ports and adapters

Every migrated module has the same skeleton. Dependencies point **inward**: the core
(`application` + `domain`) is plain Java and knows nothing of Spring, SQL or HTTP.

```mermaid
flowchart LR
    subgraph api[api]
        controller[XxxController]
        dto[XxxRequest / XxxResponse]
    end
    subgraph core[core: plain Java]
        subgraph application[application]
            service[XxxService + XxxServiceImpl<br/>commands, read models]
        end
        subgraph domain[domain]
            model[model: aggregates,<br/>value objects, events]
            port[port: XxxStore, gateways]
        end
    end
    subgraph infra[infra]
        jdbc[persistence/JdbcXxxStore<br/>SQL via JdbcClient]
        tech[event/, security/, metrics/…<br/>Spring adapters]
        config[config/XxxServices<br/>assembly + transactions]
    end

    controller --> dto
    controller --> service
    service --> model
    service --> port
    jdbc -. implements .-> port
    tech -. implements .-> port
    config -->|new XxxServiceImpl wrapped by TransactionalServices| service
```

What `ArchitectureTest` enforces in CI for the green modules:

- `domain` and `application` import no Spring, JPA, servlet, Hibernate or Micrometer, and nothing from their own `api` or `infra`;
- nobody outside a module touches its `domain.port` or `infra`;
- no persistence framework anywhere (plain SQL only);
- no cycle between the parts of a domain, and none between modules;
- `shared` never reaches into a module's `infra` or `api`;
- no module's `domain` depends on any `api` package.

## 6. Authentication

Two transports coexist, and the frontend never sends both at once (`services/http.ts`).

```mermaid
sequenceDiagram
    autonumber
    actor U as Member
    participant SPA as SPA (browser)
    participant API as backend
    participant DB as PostgreSQL
    participant KC as Keycloak

    rect rgb(30, 45, 35)
    note over U,DB: Local account: email + password, server session
    U->>SPA: email + password
    SPA->>API: POST /api/auth/login (credentials: include)
    API->>DB: load account, BCrypt check
    API->>DB: create row in spring_session
    API-->>SPA: 200 + Set-Cookie SESSION (HttpOnly, Secure, SameSite=Lax, 30 days)
    SPA->>API: later calls carry the cookie
    end

    rect rgb(45, 35, 25)
    note over U,KC: Google or GitHub through Keycloak (OIDC + PKCE)
    U->>SPA: "Continuer avec Google"
    SPA->>KC: redirect, authorization code + PKCE
    KC-->>SPA: /auth/callback with code, then access token
    SPA->>API: POST /api/oidc/sync (Authorization: Bearer)
    API->>KC: fetch JWKS (cached), verify signature and issuer
    API->>DB: find or create the local account + identity link
    SPA->>API: later calls carry the bearer token, never the cookie
    end
```

Writes with the cookie are protected without a CSRF token: `SameSite=Lax` stops other sites
from sending it, and the CORS filter answers 403 to any `Origin` outside `CORS_ORIGINS`, other
`lescracks.com` subdomains included (asserted in `SecurityConfigTest`). Admin routes are locked
twice: the `/api/admin/**` and `/api/*/admin/**` matchers in `SecurityConfig`, and
`@PreAuthorize` on each method.

## 7. Key flows

### Sign-up: one module decides, the others react to an event

```mermaid
sequenceDiagram
    autonumber
    participant C as AuthController
    participant S as SignUpService (account)
    participant DB as PostgreSQL
    participant E as AccountEvents port
    participant M as member listener
    participant N as newsletter listener
    participant Mail as SmtpMailer

    C->>S: register(command)
    S->>DB: INSERT accounts (one transaction)
    S->>E: publish AccountRegistered
    E->>M: keep the sign-up answers (member_profiles)
    E->>N: subscribe or attach the newsletter subscriber
    note over M,N: synchronous @EventListener, same transaction:<br/>a refused phone number rolls the sign-up back
    S->>Mail: send(VerificationEmail)
    note right of Mail: rendered now, delivered<br/>only after commit
    DB-->>C: commit
    Mail-)Mail: afterCommit: send on the mail-delivery thread
```

### Scheduled publication

```mermaid
sequenceDiagram
    autonumber
    participant T as PublicationScheduler (every minute)
    participant P as ScheduledPublishing (articles, events)
    participant DB as PostgreSQL
    participant A as Announcements (newsletter)
    participant Mail as SmtpMailer

    T->>P: dueForPublication(now)
    P->>DB: ids of the drafts whose scheduled_at has passed
    loop each due item, isolated
        T->>P: publishScheduled(id, now)
        P->>DB: UPDATE … WHERE still due (own transaction)
        T->>P: announce(id), after commit
        P->>A: announce to subscribers
        A->>Mail: one email per subscriber, queued
    end
```

A failure on one item is logged and never blocks the others; a failing mail server never
unpublishes content.

### SEO snapshot for a bot

```mermaid
sequenceDiagram
    participant B as Googlebot / WhatsApp
    participant N as nginx
    participant S as SeoController
    participant Cat as ArticleCatalog / EventCatalog

    B->>N: GET /blog/my-article
    N->>N: $is_seo_bot = 1
    N->>S: GET /seo/blog/my-article
    S->>Cat: requirePublished(slug)
    S-->>N: HTML with title, meta, Open Graph, JSON-LD, breadcrumbs
    N-->>B: 200 text/html
```

## 8. Data model

The essentials below; **every table, column, type, constraint and index** is in
[database.md](database.md) (one diagram per module plus a data dictionary) and
[schema.sql](schema.sql). Only keys and the columns that explain a relationship are shown here. `target_type` + `target_id` is a **polymorphic** reference
(`ARTICLE`, `EVENT`, `TALK`): it has no foreign key, by design (one engagement table for
every kind of content).

```mermaid
erDiagram
    accounts ||--o| member_profiles : "has (account_id PK)"
    accounts ||--o{ member_interests : chooses
    accounts ||--o{ account_identities : "links Google/GitHub"
    accounts ||--o{ account_tokens : "verification, reset"
    accounts |o--o| newsletter_subscribers : "may be (account_id)"
    categories ||--o{ member_interests : ""
    categories ||--o{ articles : "theme (category_id)"
    articles ||--o{ article_tags : ""
    tags ||--o{ article_tags : ""
    events ||--o{ event_registrations : ""
    accounts ||--o{ event_registrations : "user_id"
    events ||--o{ event_submissions : ""
    accounts ||--o{ event_submissions : "owner_id"
    event_submissions ||--o{ event_submission_members : team
    accounts ||--o{ event_submission_members : "user_id"
    badges ||--o{ member_badges : ""
    accounts ||--o{ member_badges : "user_id"
    accounts ||--o{ certificates : "user_id"
    events |o--o{ certificates : "event_id, nullable"
    accounts ||--o{ comments : "author_id"
    comments |o--o{ comments : "parent_id (replies)"
    comments ||--o{ comment_reports : ""
    accounts ||--o{ comment_reports : "reporter_id"
    accounts ||--o{ content_likes : "account_id"

    accounts {
        bigint id PK
        varchar email UK "lower(email)"
        varchar password_hash "null for OIDC-only"
        varchar status
        boolean email_verified
        timestamptz last_seen_at
        varchar signup_source
    }
    admins {
        bigint id PK
        varchar username UK
        varchar password_hash
        varchar status
    }
    member_profiles {
        bigint account_id PK, FK
        varchar username
        varchar country
        varchar situation
        varchar goal
        timestamptz onboarded_at
    }
    newsletter_subscribers {
        bigint id PK
        bigint account_id FK "nullable"
        varchar email UK
        varchar status
        varchar token UK
    }
    newsletter_campaigns {
        bigint id PK
        varchar subject
        int recipient_count
        timestamptz sent_at
    }
    articles {
        bigint id PK
        varchar slug UK
        bigint category_id FK
        varchar status
        timestamptz scheduled_at
        timestamptz published_at
        jsonb body "blocks"
    }
    talk_videos {
        bigint id PK
        varchar youtube_url
        varchar status
        timestamptz published_at
    }
    events {
        bigint id PK
        varchar slug UK
        varchar type
        varchar format
        timestamptz start_date
        varchar status
        boolean accepts_submissions
        int registration_count
    }
    event_submissions {
        bigint id PK
        bigint event_id FK
        bigint owner_id FK
        varchar status
        int score
    }
    certificates {
        bigint id PK
        varchar code UK "public check"
        bigint user_id FK
        bigint event_id FK
        varchar kind
        varchar status
    }
    comments {
        bigint id PK
        varchar target_type "polymorphic"
        bigint target_id "polymorphic"
        bigint author_id FK
        bigint parent_id FK
        varchar status
        int report_count
    }
    content_views {
        varchar target_type PK
        bigint target_id PK
        varchar visitor_key PK
    }
    content_likes {
        varchar target_type PK
        bigint target_id PK
        bigint account_id PK, FK
    }
    engagement_counters {
        varchar target_type PK
        bigint target_id PK
        bigint view_count
    }
```

## 9. Frontend

React 18 + Vite + TypeScript + Tailwind, served as static files by nginx. Only the landing
page, the sign-in pages and the 404 are in the first bundle; every other page and the whole
back office load on demand (`React.lazy`).

```mermaid
flowchart TB
    main[main.tsx<br/>AuthProvider OIDC, Router] --> app[App.tsx<br/>routes, MemberRoute, AdminRoute]
    app --> pages[pages/<br/>Landing, Blog, BlogPost, Evenements,<br/>EvenementDetail, Talk, Profile, Welcome…]
    app --> adminPages[pages/admin/<br/>Dashboard, Audience, Blog, ArticleStudio,<br/>Events, Badges, Users, Newsletter…]
    pages & adminPages --> components[components/<br/>ui = Radix primitives, layout, cards,<br/>blog, events, admin, community…]
    pages & adminPages --> hooks[hooks/<br/>useSession, useApi, useEventRegistration]
    hooks --> contexts[contexts/<br/>AuthContext, ThemeContext]
    pages & adminPages & hooks --> services[services/<br/>api.ts, adminApi.ts, auth.ts, types.ts]
    services --> http[services/http.ts<br/>one fetch wrapper: base URL, transport,<br/>timeouts, ApiError in French]
    http -->|/api, same origin| backend[(backend)]
    components --> lib[lib/<br/>pure helpers: slugs, dates, phone,<br/>markdown, analytics, arrival…]
```

Rules that hold today (measured): no `fetch` outside `services/`, no `any`, no deep relative
import, one `ApiError` shape mirrored from the backend.

## 10. Delivery pipeline

```mermaid
flowchart LR
    dev[feature/*, fix/*, docs/*] -->|PR, squash| develop
    develop -->|PR, merge commit, by hand| main
    main --> rp[release-please<br/>opens the release PR]
    rp -->|merged| tag[tag vX.Y.Z<br/>CHANGELOG.md]
    tag --> deploy[deploy.yml<br/>build images, push to Docker Hub,<br/>scp compose, ssh: pull + up -d]
    deploy --> vps[(VPS)]

    subgraph ci[ci.yml on every PR]
        verify[backend: mvnw verify<br/>unit + Testcontainers ITs]
        fe[frontend: typecheck, lint, build]
        images[both Docker images build]
        conv[conventions: commit format]
    end
    dev -.-> ci
```

A rollback is a manual run of `deploy.yml` with an earlier tag.

## 11. Observability

| Signal | Source | Stored in | Seen in |
| --- | --- | --- | --- |
| API metrics (HTTP, JVM, sign-ins) | `/actuator/prometheus` on port 9090 | Prometheus (15 days) | Grafana |
| Database, host, containers | postgres-exporter, node-exporter, cAdvisor | Prometheus | Grafana |
| Public reachability | blackbox exporter probes | Prometheus | Grafana alerts (`monitoring/prometheus-rules.yml`) |
| Backend logs | `/var/log/lescracks/app.log` via Promtail | Loki | Grafana |
| Audience (visits, sources) | Umami script injected by nginx | Umami database | Umami, and the admin Audience page |
