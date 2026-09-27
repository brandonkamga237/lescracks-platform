package com.brandonkamga.lescracks.stats.domain;

import com.brandonkamga.lescracks.event.domain.Event;
import com.brandonkamga.lescracks.event.domain.EventStatus;
import com.brandonkamga.lescracks.event.infra.EventRepository;
import com.brandonkamga.lescracks.identity.infra.UserRepository;
import com.brandonkamga.lescracks.newsletter.domain.NewsletterStatus;
import com.brandonkamga.lescracks.newsletter.infra.NewsletterSubscriptionRepository;
import com.brandonkamga.lescracks.resource.domain.Resource;
import com.brandonkamga.lescracks.resource.domain.ResourceStatus;
import com.brandonkamga.lescracks.resource.infra.ResourceRepository;
import com.brandonkamga.lescracks.stats.api.dto.AudienceResponse;
import com.brandonkamga.lescracks.stats.api.dto.ContentViewsResponse;
import com.brandonkamga.lescracks.stats.api.dto.NamedCount;
import com.brandonkamga.lescracks.stats.api.dto.SeriesPoint;
import com.brandonkamga.lescracks.stats.api.dto.StatsOverviewResponse;
import com.brandonkamga.lescracks.stats.api.dto.TopResourceResponse;
import com.brandonkamga.lescracks.stats.api.dto.UserGrowthPoint;
import com.brandonkamga.lescracks.stats.api.dto.ViewedEvent;
import com.brandonkamga.lescracks.stats.api.dto.ViewedResource;
import com.brandonkamga.lescracks.stats.api.dto.WatchResponse;
import com.brandonkamga.lescracks.stats.api.dto.WatchSignal;
import com.brandonkamga.lescracks.stats.infra.UmamiClient;
import com.brandonkamga.lescracks.talk.domain.TalkStatus;
import com.brandonkamga.lescracks.talk.infra.TalkVideoRepository;
import com.fasterxml.jackson.databind.JsonNode;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Date;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class StatsServiceImpl implements StatsService {
    private static final Logger log = LoggerFactory.getLogger(StatsServiceImpl.class);

    private final UserRepository users;
    private final EventRepository events;
    private final ResourceRepository resources;
    private final NewsletterSubscriptionRepository newsletter;
    private final TalkVideoRepository talks;
    private final UmamiClient umami;

    public StatsServiceImpl(UserRepository users, EventRepository events, ResourceRepository resources,
                            NewsletterSubscriptionRepository newsletter, TalkVideoRepository talks,
                            UmamiClient umami) {
        this.users = users;
        this.events = events;
        this.resources = resources;
        this.newsletter = newsletter;
        this.talks = talks;
        this.umami = umami;
    }

    /**
     * Every breakdown is a grouped count query.
     *
     * This used to load all users, events and resources into memory and count them there,
     * which turned the dashboard into the slowest page on the platform as the tables grew.
     */
    @Override
    public StatsOverviewResponse overview() {
        Instant now = Instant.now();
        Instant days30 = now.minus(30, ChronoUnit.DAYS);
        Instant days7 = now.minus(7, ChronoUnit.DAYS);

        Map<String, Long> usersByStatus = toCounts(users.countGroupedByStatus());
        Map<String, Long> usersByProvider = toCounts(users.countGroupedByProvider());
        Map<String, Long> eventsByStatus = toCounts(events.countGroupedByStatus());
        Map<String, Long> eventsByType = toCounts(events.countGroupedByType());
        Map<String, Long> resourcesByStatus = toCounts(resources.countGroupedByStatus());
        Map<String, Long> resourcesByCategory = toCounts(resources.countGroupedByCategory());
        Map<String, Long> resourcesByKind = new LinkedHashMap<>();
        resourcesByKind.put("EXTERNAL_VIDEO", resources.countExternalVideos());
        resourcesByKind.put("EBOOK", resources.countEbooks());
        resourcesByKind.put("ARTICLE", resources.countArticles());

        long upcoming = 0;
        long ongoing = 0;
        long past = 0;
        Instant todayStart = LocalDate.now(ZoneOffset.UTC).atStartOfDay().toInstant(ZoneOffset.UTC);
        for (Event event : events.findByStatus(EventStatus.PUBLISHED)) {
            Instant start = event.getStartDate();
            Instant end = event.getEndDate() != null ? event.getEndDate() : todayStart;
            if (start.isAfter(now)) upcoming++;
            else if (end.isAfter(now) || !end.isBefore(todayStart)) ongoing++;
            else past++;
        }

        long talksPublished = talks.countByStatus(TalkStatus.PUBLISHED);

        return new StatsOverviewResponse(
                total(usersByStatus), usersByStatus, usersByProvider, users.countByEmailVerifiedTrue(),
                users.countByCreatedAtAfter(days30),
                users.countByLastSeenAtAfter(days7), users.countByLastSeenAtAfter(days30),
                total(eventsByStatus), eventsByStatus, eventsByType,
                upcoming, ongoing, past,
                total(resourcesByStatus), resourcesByStatus, resourcesByKind, resourcesByCategory,
                newsletter.countByStatus(NewsletterStatus.SUBSCRIBED),
                newsletter.countByStatus(NewsletterStatus.UNSUBSCRIBED),
                newsletter.countByStatusAndSubscribedAtAfter(NewsletterStatus.SUBSCRIBED, days30),
                talks.count(), talksPublished);
    }

    @Override
    public List<UserGrowthPoint> userGrowth(Instant from, Instant to) {
        return toGrowthPoints(users.userGrowth(from, to));
    }

    @Override
    public List<UserGrowthPoint> newsletterGrowth(Instant from, Instant to) {
        return toGrowthPoints(newsletter.newsletterGrowth(from, to));
    }

    @Override
    public List<TopResourceResponse> topResources(int limit) {
        return resources.topResources(PageRequest.of(0, limit)).stream()
                .map(row -> new TopResourceResponse(
                        ((Number) row[0]).longValue(),
                        (String) row[1],
                        ((Number) row[2]).longValue()))
                .collect(Collectors.toList());
    }

    @Override
    public AudienceResponse audience(int days) {
        if (!umami.isEnabled()) return AudienceResponse.unavailable(days);
        try {
            Instant to = Instant.now();
            Instant from = to.minus(days, ChronoUnit.DAYS);
            JsonNode stats = umami.stats(from, to);
            JsonNode series = umami.pageviews(from, to);
            JsonNode sources = umami.metrics("referrer", from, to, 8);
            JsonNode countries = umami.metrics("country", from, to, 8);
            JsonNode pages = umami.metrics("url", from, to, 10);

            long visits = valueOf(stats, "visits");
            long bounces = valueOf(stats, "bounces");
            Double bounceRate = visits > 0 ? Math.round(bounces * 1000.0 / visits) / 10.0 : null;
            Long avgVisit = visits > 0 ? Math.round(valueOf(stats, "totaltime") * 1.0 / visits) : null;

            return new AudienceResponse(true, days,
                    valueOf(stats, "visitors"), prevOf(stats, "visitors"),
                    visits, prevOf(stats, "visits"),
                    valueOf(stats, "pageviews"), prevOf(stats, "pageviews"),
                    bounceRate, avgVisit,
                    toSeries(series), toNamedCounts(sources), toNamedCounts(countries), toNamedCounts(pages));
        } catch (Exception exception) {
            log.warn("Umami audience unavailable: {}", exception.getMessage());
            return AudienceResponse.unavailable(days);
        }
    }

    @Override
    public ContentViewsResponse contentViews(int days) {
        if (!umami.isEnabled()) return ContentViewsResponse.unavailable(days);
        try {
            Map<String, Long> urls = urlViews(days);
            Map<String, Long> resourceViews = pick(urls, "/ressources/");
            Map<String, Long> eventViews = pick(urls, "/evenements/");

            List<ViewedResource> viewedResources = resources.findBySlugIn(resourceViews.keySet()).stream()
                    .map(r -> new ViewedResource(r.getId(), r.getSlug(), r.getTitle(), r.getCoverImage(),
                            r.getCategory() != null ? r.getCategory().getName() : null,
                            resourceViews.getOrDefault(r.getSlug(), 0L)))
                    .sorted(Comparator.comparingLong(ViewedResource::views).reversed())
                    .limit(12)
                    .toList();

            List<ViewedEvent> viewedEvents = events.findBySlugIn(eventViews.keySet()).stream()
                    .map(e -> new ViewedEvent(e.getId(), e.getSlug(), e.getTitle(), e.getStartDate(),
                            e.getStatus().name(), eventViews.getOrDefault(e.getSlug(), 0L)))
                    .sorted(Comparator.comparingLong(ViewedEvent::views).reversed())
                    .limit(12)
                    .toList();

            return new ContentViewsResponse(true, days, viewedResources, viewedEvents);
        } catch (Exception exception) {
            log.warn("Umami content views unavailable: {}", exception.getMessage());
            return ContentViewsResponse.unavailable(days);
        }
    }

    /**
     * Product signals, not technical alerts. Each one says what happens, for how
     * long, and points to the admin surface where something can be done. None of
     * them guesses at causes the data cannot prove.
     */
    @Override
    public WatchResponse watch() {
        Instant now = Instant.now();
        Instant days7 = now.minus(7, ChronoUnit.DAYS);
        Instant days14 = now.minus(14, ChronoUnit.DAYS);
        Instant days30 = now.minus(30, ChronoUnit.DAYS);
        List<WatchSignal> signals = new ArrayList<>();

        LocalDate weekStart = LocalDate.now(ZoneOffset.UTC).minusDays(7);
        List<UserGrowthPoint> growth = userGrowth(days14, now);
        long lastWeek = growth.stream().filter(p -> !p.date().isBefore(weekStart)).mapToLong(UserGrowthPoint::count).sum();
        long previousWeek = growth.stream().filter(p -> p.date().isBefore(weekStart)).mapToLong(UserGrowthPoint::count).sum();
        if (previousWeek >= 5 && lastWeek < previousWeek * 0.7) {
            long drop = Math.round(100.0 * (previousWeek - lastWeek) / previousWeek);
            signals.add(new WatchSignal("registrations-drop", "warning",
                    "Les inscriptions ralentissent",
                    lastWeek + " inscriptions sur 7 jours contre " + previousWeek
                            + " la semaine précédente, soit environ -" + drop + " %.",
                    "Voir les utilisateurs", "/admin/utilisateurs"));
        }

        Map<String, Long> urlViews = Map.of();
        if (umami.isEnabled()) {
            try {
                urlViews = urlViews(30);
                JsonNode stats = umami.stats(days14, now);
                long visitors = valueOf(stats, "visitors");
                long previous = prevOf(stats, "visitors");
                if (previous >= 20 && visitors < previous * 0.75) {
                    long drop = Math.round(100.0 * (previous - visitors) / previous);
                    signals.add(new WatchSignal("audience-drop", "warning",
                            "La fréquentation baisse",
                            "Environ -" + drop + " % de visiteurs sur 14 jours par rapport à la période précédente.",
                            "Voir l’audience", "/admin/audience"));
                }
            } catch (Exception exception) {
                log.warn("Umami watch signals skipped: {}", exception.getMessage());
            }
        }

        final Map<String, Long> eventViews = urlViews;
        Instant soon = now.plus(14, ChronoUnit.DAYS);
        events.findByStatus(EventStatus.PUBLISHED).stream()
                .filter(e -> e.getStartDate() != null && e.getStartDate().isAfter(now) && e.getStartDate().isBefore(soon))
                .limit(3)
                .forEach(event -> {
                    long views = eventViews.getOrDefault("/evenements/" + event.getSlug(), 0L);
                    if (views < 25) {
                        signals.add(new WatchSignal("event-low-visibility-" + event.getId(), "warning",
                                "« " + event.getTitle() + " » arrive bientôt",
                                "L’événement a lieu dans moins de 14 jours mais sa page n’a été vue que "
                                        + views + " fois en 30 jours.",
                                "Voir l’événement", "/admin/evenements"));
                    }
                });

        if (umami.isEnabled() && !urlViews.isEmpty()) {
            final Map<String, Long> resourceViews = urlViews;
            long unseen = resources.findByStatusOrderByCreatedAtDesc(ResourceStatus.PUBLISHED).stream()
                    .filter(r -> r.getCreatedAt().isBefore(days30))
                    .filter(r -> resourceViews.getOrDefault("/ressources/" + r.getSlug(), 0L) < 5)
                    .count();
            if (unseen > 0) {
                signals.add(new WatchSignal("unseen-resources", "info",
                        unseen + " ressource" + (unseen > 1 ? "s" : "") + " presque invisibles",
                        "Publiées depuis plus de 30 jours, moins de 5 consultations sur la période.",
                        "Voir les ressources", "/admin/ressources"));
            }
        }

        long unsubscribed = newsletter.countByStatusAndUnsubscribedAtAfter(NewsletterStatus.UNSUBSCRIBED, days7);
        long subscribed = newsletter.countByStatusAndSubscribedAtAfter(NewsletterStatus.SUBSCRIBED, days7);
        if (unsubscribed > 0 && unsubscribed >= subscribed) {
            signals.add(new WatchSignal("newsletter-churn", "warning",
                    "Plus de désabonnements que d’abonnements",
                    unsubscribed + " désabonnements contre " + subscribed + " nouveaux abonnés sur 7 jours.",
                    "Voir la newsletter", "/admin/newsletter"));
        }

        long staleDrafts = resources.findByStatusOrderByCreatedAtDesc(ResourceStatus.DRAFT).stream()
                .filter(r -> r.getCreatedAt().isBefore(days14))
                .count();
        if (staleDrafts > 0) {
            signals.add(new WatchSignal("stale-drafts", "info",
                    staleDrafts + " brouillon" + (staleDrafts > 1 ? "s" : "") + " en attente",
                    "Ces contenus n’ont pas été touchés depuis plus de 14 jours.",
                    "Reprendre les brouillons", "/admin/ressources"));
        }

        return new WatchResponse(signals);
    }

    /** Umami url metrics reduced to path → views. */
    private Map<String, Long> urlViews(int days) {
        Instant to = Instant.now();
        Instant from = to.minus(days, ChronoUnit.DAYS);
        JsonNode metrics = umami.metrics("url", from, to, 500);
        Map<String, Long> views = new HashMap<>();
        if (metrics != null && metrics.isArray()) {
            for (JsonNode row : metrics) {
                views.merge(row.get("x").asText(), row.get("y").asLong(), Long::sum);
            }
        }
        return views;
    }

    /** Keep only paths under a route prefix, keyed by the slug segment. */
    private Map<String, Long> pick(Map<String, Long> urls, String prefix) {
        Map<String, Long> picked = new HashMap<>();
        urls.forEach((path, count) -> {
            if (path != null && path.startsWith(prefix) && path.length() > prefix.length()) {
                picked.merge(path.substring(prefix.length()), count, Long::sum);
            }
        });
        return picked;
    }

    private long valueOf(JsonNode stats, String key) {
        JsonNode node = stats.get(key);
        if (node == null) return 0;
        return node.has("value") ? node.get("value").asLong() : node.asLong();
    }

    private long prevOf(JsonNode stats, String key) {
        JsonNode node = stats.get(key);
        return node != null && node.has("prev") ? node.get("prev").asLong() : 0;
    }

    private List<SeriesPoint> toSeries(JsonNode series) {
        Map<LocalDate, Long> pageviews = indexSeries(series.get("pageviews"));
        Map<LocalDate, Long> sessions = indexSeries(series.get("sessions"));
        return pageviews.keySet().stream().sorted()
                .map(date -> new SeriesPoint(date, pageviews.get(date), sessions.getOrDefault(date, 0L)))
                .toList();
    }

    private Map<LocalDate, Long> indexSeries(JsonNode points) {
        Map<LocalDate, Long> indexed = new HashMap<>();
        if (points != null && points.isArray()) {
            for (JsonNode point : points) {
                String x = point.get("x").asText();
                // Umami day buckets come as "yyyy-MM-dd HH:mm:ss" — keep the date part.
                indexed.merge(LocalDate.parse(x.substring(0, 10)), point.get("y").asLong(), Long::sum);
            }
        }
        return indexed;
    }

    private List<NamedCount> toNamedCounts(JsonNode metrics) {
        List<NamedCount> counts = new ArrayList<>();
        if (metrics != null && metrics.isArray()) {
            for (JsonNode row : metrics) {
                String name = row.get("x").isNull() || row.get("x").asText().isBlank()
                        ? "(direct)" : row.get("x").asText();
                counts.add(new NamedCount(name, row.get("y").asLong()));
            }
        }
        return counts;
    }

    private List<UserGrowthPoint> toGrowthPoints(List<Object[]> rows) {
        return rows.stream()
                .map(row -> new UserGrowthPoint(
                        ((Date) row[0]).toLocalDate(),
                        ((Number) row[1]).longValue()))
                .collect(Collectors.toList());
    }

    /** Grouped-count rows arrive as [key, count]; enum keys are exposed by name. */
    private Map<String, Long> toCounts(List<Object[]> rows) {
        Map<String, Long> counts = new LinkedHashMap<>();
        for (Object[] row : rows) {
            if (row[0] == null) continue;
            String key = row[0] instanceof Enum<?> value ? value.name() : row[0].toString();
            counts.put(key, ((Number) row[1]).longValue());
        }
        return counts;
    }

    private long total(Map<String, Long> counts) {
        return counts.values().stream().mapToLong(Long::longValue).sum();
    }
}
