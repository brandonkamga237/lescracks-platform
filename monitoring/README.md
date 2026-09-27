# Observabilité LesCracks

La plateforme répond à deux familles de questions, avec deux outils différents :

- **Technique** — la plateforme fonctionne-t-elle ? → **Prometheus + Grafana + Loki**
- **Produit** — qui l'utilise et comment ? → **Umami** (analytics respectueux de la vie privée)

Grafana : `https://grafana.lescracks.com` · Umami : `https://umami.lescracks.com`
Les deux n'ont rien à voir : ne cherche pas les visiteurs dans Grafana ni la latence p95 dans Umami.

---

## 1. Disponibilité — « est-ce que ça tourne ? »

| Question | Où |
|---|---|
| Backend / PostgreSQL / Keycloak UP ? | `up{job=...}` dans Grafana (job par service) |
| Le site public est-il accessible de l'extérieur ? | `probe_success{job="blackbox-public"}` — sondes réelles sur `lescracks.com`, `api.lescracks.com/api/events`, `auth.lescracks.com`, `minio.lescracks.com` |
| MinIO disponible pour l'API ? | indicateur `storage` dans `/actuator/health` (healthcheck Docker) |
| Dernière interruption, durée ? | historique de `probe_success` + alertes `PublicEndpointDown` / `*Down` |
| Requêtes perdues à cause d'une panne ? | `http_server_requests_seconds_count{status=~"5.."}` |

## 2. Trafic — « combien de requêtes ? »

| Question | Où |
|---|---|
| Requêtes/seconde, par endpoint, répartition | `rate(http_server_requests_seconds_count[5m])` par `uri` |
| Trafic authentifié vs anonyme | croiser `status=~"401\|403"` vs 2xx, ou Umami (sessions) |
| Pages les plus consultées, heures de pic | **Umami** |

## 3–5. Visiteurs, acquisition, pages — **Umami uniquement**

Visiteurs uniques (jour/semaine/mois), sessions, durée moyenne, sources (direct, Google, LinkedIn, YouTube…), pages les plus/moins vues, pages de sortie, chemins vers une ressource ou un événement.

> Prometheus compte des requêtes HTTP, pas des visiteurs. Une page vue SPA n'est pas une requête API.

## 6. Authentification — « les gens arrivent-ils à se connecter ? »

| Question | Où |
|---|---|
| Tentatives / réussites / échecs de login | `auth_login_total{audience="member\|admin", outcome="success\|failure"}` |
| Répartition par provider | `auth_login_total` tag `provider` : `local`, `google`, `github` |
| Inscriptions qui échouent | `auth_register_total{outcome="failure"}` |
| Erreurs OAuth côté Keycloak | métriques Keycloak (`keycloak` job) + logs Loki |
| Pic de brute-force | alerte `LoginFailuresSpike` |

## 7. API, erreurs, performance — « comment se comporte le backend ? »

| Question | Où |
|---|---|
| Endpoint le plus chargé / le plus lent / le plus en erreur | `http_server_requests_seconds_*` groupé par `uri` |
| Taux 2xx / 4xx / 5xx | `sum(rate(...{status=~"2.."})) / sum(rate(...))` |
| p50 / p95 / p99 | `histogram_quantile(0.95, sum(rate(..._bucket[5m])) by (le, uri))` |
| Quelles erreurs, quand, sur quelle route | **Loki** : `{job="lescracks-backend"} |= "ERROR"` |
| Nouvelle version a cassé quelque chose ? | comparer avant/après un déploiement — `info.build` dans `/actuator/info` porte la version (goal `build-info`) |

## 8. PostgreSQL — « la base est-elle le problème ? »

| Question | Où |
|---|---|
| Connexions ouvertes / pool saturé / threads en attente | `hikaricp_connections_*` (backend) — alerte `ConnectionPoolSaturated` |
| Requêtes, taille de la base, transactions | job `postgres` (postgres-exporter) : `pg_stat_database_*` |
| DB DOWN | alerte `PostgresDown` |

## 9. Infrastructure et conteneurs — « le VPS arrive-t-il à ses limites ? »

| Question | Où |
|---|---|
| CPU / RAM / disque / réseau du serveur | job `node` (node-exporter) — alertes `DiskAlmostFull`, `NodeMemoryHigh`, `NodeCpuHigh` |
| Quel conteneur consomme / redémarre | job `cadvisor` : `container_cpu_usage_seconds_total`, `container_memory_working_set_bytes`, `container_start_time_seconds` — alerte `ContainerRestartingFrequently` |

## 10. Déploiements — « mon dernier changement a-t-il cassé quelque chose ? »

Après chaque `up -d` : regarder dans Grafana les courbes de `http_server_requests` (erreurs, p95), `jvm_memory_*`, `up{}` — la version déployée est lisible dans `/actuator/info` (`info.build.version`).

## 11. Alertes — « dois-je intervenir maintenant ? »

Toutes dans `prometheus-rules.yml`. Branche un Alertmanager (ou le webhook Grafana) pour recevoir les notifications — les règles évaluent déjà ; seule la notification manque.

---

## Fichiers

```
monitoring/
├── prometheus.yml          cibles : backend:9090, keycloak, postgres, node, cadvisor, blackbox
├── prometheus-rules.yml    règles d'alerte
├── blackbox.yml            module de sonde HTTP externe
├── loki.yml                rétention 7 jours
├── promtail.yml            /var/log/lescracks/*.log → Loki
└── grafana/                datasource + dashboard LesCracks provisionnés
```

Actuator tourne sur le port **9090** interne : `api.lescracks.com/actuator/*` ne répond pas
publiquement, et c'est voulu — seul le réseau `lescracks-internal` voit les métriques.
