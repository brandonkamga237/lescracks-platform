package com.brandonkamga.lescracks.stats.domain;

import com.brandonkamga.lescracks.event.infra.EventRepository;
import com.brandonkamga.lescracks.identity.infra.UserRepository;
import com.brandonkamga.lescracks.newsletter.domain.NewsletterStatus;
import com.brandonkamga.lescracks.newsletter.infra.NewsletterSubscriptionRepository;
import com.brandonkamga.lescracks.resource.infra.ResourceRepository;
import com.brandonkamga.lescracks.stats.api.dto.StatsOverviewResponse;
import com.brandonkamga.lescracks.stats.api.dto.TopResourceResponse;
import com.brandonkamga.lescracks.stats.api.dto.UserGrowthPoint;

import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Date;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class StatsServiceImpl implements StatsService {
    private final UserRepository users;
    private final EventRepository events;
    private final ResourceRepository resources;
    private final NewsletterSubscriptionRepository newsletter;

    public StatsServiceImpl(UserRepository users, EventRepository events, ResourceRepository resources,
                            NewsletterSubscriptionRepository newsletter) {
        this.users = users;
        this.events = events;
        this.resources = resources;
        this.newsletter = newsletter;
    }

    /**
     * Every breakdown is a grouped count query.
     *
     * This used to load all users, events and resources into memory and count them there,
     * which turned the dashboard into the slowest page on the platform as the tables grew.
     */
    @Override
    public StatsOverviewResponse overview() {
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

        return new StatsOverviewResponse(
                total(usersByStatus), usersByStatus, usersByProvider, users.countByEmailVerifiedTrue(),
                total(eventsByStatus), eventsByStatus, eventsByType,
                total(resourcesByStatus), resourcesByStatus, resourcesByKind, resourcesByCategory,
                newsletter.countByStatus(NewsletterStatus.SUBSCRIBED),
                newsletter.countByStatus(NewsletterStatus.UNSUBSCRIBED));
    }

    @Override
    public List<UserGrowthPoint> userGrowth(Instant from, Instant to) {
        return users.userGrowth(from, to).stream()
                .map(row -> new UserGrowthPoint(
                        ((Date) row[0]).toLocalDate(),
                        ((Number) row[1]).longValue()))
                .collect(Collectors.toList());
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
