package com.brandonkamga.lescracks.stats.domain;

import com.brandonkamga.lescracks.account.application.AccountStatistics;
import com.brandonkamga.lescracks.content.application.ContentStatistics;
import com.brandonkamga.lescracks.engagement.application.EngagementCounts;
import com.brandonkamga.lescracks.engagement.domain.model.Counts;
import com.brandonkamga.lescracks.engagement.domain.model.TargetType;
import com.brandonkamga.lescracks.event.application.EventStatistics;
import com.brandonkamga.lescracks.member.application.MemberStatistics;
import com.brandonkamga.lescracks.newsletter.application.NewsletterStatistics;
import com.brandonkamga.lescracks.newsletter.domain.model.SubscriptionStatus;
import com.brandonkamga.lescracks.stats.api.dto.AudienceResponse;
import com.brandonkamga.lescracks.stats.api.dto.ContentViewsResponse;
import com.brandonkamga.lescracks.stats.api.dto.ConversionsResponse;
import com.brandonkamga.lescracks.stats.api.dto.MemberPortraitResponse;
import com.brandonkamga.lescracks.stats.api.dto.NamedCount;
import com.brandonkamga.lescracks.stats.api.dto.SeriesPoint;
import com.brandonkamga.lescracks.stats.api.dto.SignupFunnel;
import com.brandonkamga.lescracks.stats.api.dto.StatsOverviewResponse;
import com.brandonkamga.lescracks.stats.api.dto.SubscriberFlowPoint;
import com.brandonkamga.lescracks.stats.api.dto.TopResourceResponse;
import com.brandonkamga.lescracks.stats.api.dto.UserGrowthPoint;
import com.brandonkamga.lescracks.stats.api.dto.ViewedEvent;
import com.brandonkamga.lescracks.stats.api.dto.ViewedResource;
import com.brandonkamga.lescracks.stats.api.dto.WatchResponse;
import com.brandonkamga.lescracks.stats.api.dto.WatchSignal;
import com.brandonkamga.lescracks.stats.infra.UmamiClient;
import com.brandonkamga.lescracks.taxonomy.application.TaxonomyService;
import com.brandonkamga.lescracks.taxonomy.domain.model.Category;
import com.fasterxml.jackson.databind.JsonNode;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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

    private final AccountStatistics accounts;
    private final MemberStatistics members;
    private final EngagementCounts engagement;
    private final EventStatistics events;
    private final ContentStatistics content;
    private final NewsletterStatistics newsletter;
    private final UmamiClient umami;
    private final TaxonomyService taxonomy;

    public StatsServiceImpl(AccountStatistics accounts, MemberStatistics members, EngagementCounts engagement, EventStatistics events,
                            ContentStatistics content, NewsletterStatistics newsletter, UmamiClient umami, TaxonomyService taxonomy) {
        this.accounts = accounts;
        this.members = members;
        this.engagement = engagement;
        this.events = events;
        this.content = content;
        this.newsletter = newsletter;
        this.umami = umami;
        this.taxonomy = taxonomy;
    }

    @Override
    public MemberPortraitResponse memberPortrait() {
        Map<Long, String> themes = themeNames();
        // An interest whose theme was deleted since has no name to show: it is left out.
        List<NamedCount> interests = members.byInterest().entrySet().stream()
                .filter(entry -> themes.containsKey(entry.getKey()))
                .map(entry -> new NamedCount(themes.get(entry.getKey()), entry.getValue()))
                .sorted(Comparator.comparingLong(NamedCount::count).reversed())
                .toList();
        return new MemberPortraitResponse(total(accounts.membersByStatus()),
                grouped(members.bySituation()),
                grouped(members.byGoal()),
                grouped(members.byCountry()),
                interests,
                grouped(accounts.membersByProvider()));
    }

    /** (key, count) rows as named counts, fullest first; enum keys travel as their name. */
    private static List<NamedCount> grouped(Map<String, Long> counts) {
        return counts.entrySet().stream()
                .map(entry -> new NamedCount(entry.getKey(), entry.getValue()))
                .sorted(Comparator.comparingLong(NamedCount::count).reversed())
                .toList();
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

        Map<String, Long> usersByStatus = accounts.membersByStatus();
        Map<String, Long> usersByProvider = accounts.membersByProvider();
        Map<String, Long> eventsByStatus = events.eventsByStatus();
        Map<String, Long> eventsByType = events.eventsByType();
        Map<String, Long> resourcesByStatus = content.articlesByStatus();
        Map<String, Long> resourcesByCategory = articlesByTheme();

        Instant todayStart = LocalDate.now(ZoneOffset.UTC).atStartOfDay().toInstant(ZoneOffset.UTC);
        EventStatistics.Timing timing = events.publishedTiming(now, todayStart);


        return new StatsOverviewResponse(
                total(usersByStatus), usersByStatus, usersByProvider, accounts.verifiedMembers(),
                accounts.membersCreatedSince(days30),
                accounts.seenSince(days7), accounts.seenSince(days30),
                newsletter.countWithoutAccount(), funnel(accounts.signupsSince(days30)),
                total(eventsByStatus), eventsByStatus, eventsByType,
                timing.upcoming(), timing.ongoing(), timing.past(),
                total(resourcesByStatus), resourcesByStatus, resourcesByCategory,
                newsletter.countByStatus(SubscriptionStatus.SUBSCRIBED),
                newsletter.countByStatus(SubscriptionStatus.UNSUBSCRIBED),
                newsletter.subscribedSince(days30),
                content.countTalks(), content.countPublishedTalks());
    }

    private Map<Long, String> themeNames() {
        return taxonomy.listCategories().stream().collect(Collectors.toMap(Category::getId, Category::getName));
    }

    /** Fullest theme first, by name. */
    private Map<String, Long> articlesByTheme() {
        Map<Long, String> themes = themeNames();
        Map<String, Long> counts = new LinkedHashMap<>();
        content.articlesByCategory().forEach((id, count) -> counts.merge(themes.getOrDefault(id, "?"), count, Long::sum));
        return counts;
    }

    private SignupFunnel funnel(AccountStatistics.SignupCohort cohort) {
        return new SignupFunnel(cohort.signedUp(), cohort.verified(), members.countOnboarded(cohort.accountIds()), cohort.returned());
    }

    // Every day of the range, quiet days included: the dashboard compares periods by date, and a
    // series with only the active days made the last 30 points span far more than 30 days.
    @Override
    public List<UserGrowthPoint> userGrowth(Instant from, Instant to) {
        Map<LocalDate, Long> joined = accounts.memberGrowth(from, to);
        return daysOf(from, to).stream().map(day -> new UserGrowthPoint(day, joined.getOrDefault(day, 0L))).toList();
    }

    @Override
    public List<SubscriberFlowPoint> newsletterGrowth(Instant from, Instant to) {
        Map<LocalDate, Long> joined = newsletter.growth(from, to);
        Map<LocalDate, Long> left = newsletter.unsubscriptions(from, to);
        return daysOf(from, to).stream()
                .map(day -> new SubscriberFlowPoint(day, joined.getOrDefault(day, 0L), left.getOrDefault(day, 0L)))
                .toList();
    }

    /** The UTC days from {@code from} until {@code to}, which is exclusive when it falls on midnight. */
    private static List<LocalDate> daysOf(Instant from, Instant to) {
        LocalDate first = LocalDate.ofInstant(from, ZoneOffset.UTC);
        LocalDate end = LocalDate.ofInstant(to.minusNanos(1), ZoneOffset.UTC);
        List<LocalDate> days = new ArrayList<>();
        for (LocalDate day = first; !day.isAfter(end); day = day.plusDays(1)) days.add(day);
        return days;
    }

    @Override
    public List<TopResourceResponse> topResources(int limit) {
        Map<Long, Counts> ranked = engagement.listMostLiked(TargetType.ARTICLE, limit);
        Map<Long, String> titles = content.articleTitles(ranked.keySet());
        return ranked.entrySet().stream().filter(entry -> titles.containsKey(entry.getKey()))
                .map(entry -> new TopResourceResponse(entry.getKey(), titles.get(entry.getKey()), entry.getValue().likes()))
                .toList();
    }


    /** Optional on top of the audience: a failure here leaves the visitor figures standing. */
    private List<NamedCount> events(Instant from, Instant to) {
        try {
            return toNamedCounts(umami.metrics("event", from, to, 12));
        } catch (Exception exception) {
            log.warn("Umami events unavailable: {}", exception.getMessage());
            return List.of();
        }
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
                    toSeries(series), toNamedCounts(sources), toNamedCounts(countries), toNamedCounts(pages),
                    events(from, to));
        } catch (Exception exception) {
            log.warn("Umami audience unavailable: {}", exception.getMessage());
            return AudienceResponse.unavailable(days);
        }
    }

    @Override
    public ConversionsResponse conversions(int days) {
        Instant since = Instant.now().minus(days, ChronoUnit.DAYS);
        List<EventStatistics.EventFunnel> funnels = events.funnels(12);
        Map<Long, Counts> views = engagement.countsOf(TargetType.EVENT, funnels.stream().map(EventStatistics.EventFunnel::id).toList());
        return new ConversionsResponse(days,
                grouped(accounts.signupsBySource(since)),
                grouped(accounts.signupsByLandingPage(since, 10)),
                funnels.stream().map(funnel -> new ConversionsResponse.EventFunnel(funnel.id(), funnel.slug(), funnel.title(),
                        funnel.startDate(), funnel.acceptsSubmissions(), views.getOrDefault(funnel.id(), Counts.NONE).views(),
                        funnel.registrations(), funnel.attended(), funnel.projects())).toList());
    }

    @Override
    public ContentViewsResponse contentViews(int days) {
        if (!umami.isEnabled()) return ContentViewsResponse.unavailable(days);
        try {
            Map<String, Long> urls = urlViews(days);
            // Articles moved from /ressources to /blog; both still count until the old links fade out.
            Map<String, Long> resourceViews = new HashMap<>(pick(urls, "/ressources/"));
            pick(urls, "/blog/").forEach((slug, views) -> resourceViews.merge(slug, views, Long::sum));
            Map<Long, String> themes = themeNames();
            Map<String, Long> eventViews = pick(urls, "/evenements/");

            List<ViewedResource> viewedResources = content.articlesBySlug(resourceViews.keySet()).stream()
                    .map(article -> new ViewedResource(article.id(), article.slug(), article.title(), article.coverImage(),
                            themes.get(article.categoryId()), resourceViews.getOrDefault(article.slug(), 0L)))
                    .sorted(Comparator.comparingLong(ViewedResource::views).reversed())
                    .limit(12)
                    .toList();

            List<ViewedEvent> viewedEvents = events.eventsByPathKey(eventViews.keySet()).stream()
                    .map(e -> new ViewedEvent(e.id(), e.slug(), e.title(), e.startDate(), e.status(),
                            eventViews.getOrDefault(e.slug(), 0L) + eventViews.getOrDefault(String.valueOf(e.id()), 0L)))
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
        events.publishedStartingBetween(now, soon, 3)
                .forEach(event -> {
                    long views = eventViews.getOrDefault("/evenements/" + event.slug(), 0L)
                            + eventViews.getOrDefault("/evenements/" + event.id(), 0L);
                    if (views < 25) {
                        signals.add(new WatchSignal("event-low-visibility-" + event.id(), "warning",
                                "« " + event.title() + " » arrive bientôt",
                                "L’événement a lieu dans moins de 14 jours mais sa page n’a été vue que "
                                        + views + " fois en 30 jours.",
                                "Voir l’événement", "/admin/evenements"));
                    }
                });

        if (umami.isEnabled() && !urlViews.isEmpty()) {
            final Map<String, Long> resourceViews = urlViews;
            long unseen = content.publishedSlugsBefore(days30).stream()
                    .filter(slug -> resourceViews.getOrDefault("/ressources/" + slug, 0L)
                            + resourceViews.getOrDefault("/blog/" + slug, 0L) < 5)
                    .count();
            if (unseen > 0) {
                signals.add(new WatchSignal("unseen-resources", "info",
                        unseen + " ressource" + (unseen > 1 ? "s" : "") + " presque invisibles",
                        "Publiées depuis plus de 30 jours, moins de 5 consultations sur la période.",
                        "Voir les ressources", "/admin/ressources"));
            }
        }

        long unsubscribed = newsletter.unsubscribedSince(days7);
        long subscribed = newsletter.subscribedSince(days7);
        if (unsubscribed > 0 && unsubscribed >= subscribed) {
            signals.add(new WatchSignal("newsletter-churn", "warning",
                    "Plus de désabonnements que d’abonnements",
                    unsubscribed + " désabonnements contre " + subscribed + " nouveaux abonnés sur 7 jours.",
                    "Voir la newsletter", "/admin/newsletter"));
        }

        long staleDrafts = content.countDraftsUntouchedSince(days14);
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


    private long total(Map<String, Long> counts) {
        return counts.values().stream().mapToLong(Long::longValue).sum();
    }
}
