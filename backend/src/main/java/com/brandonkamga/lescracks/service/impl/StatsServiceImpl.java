package com.brandonkamga.lescracks.service.impl;

import com.brandonkamga.lescracks.domain.NewsletterStatus;
import com.brandonkamga.lescracks.dto.admin.StatsOverviewResponse;
import com.brandonkamga.lescracks.dto.admin.TopResourceResponse;
import com.brandonkamga.lescracks.dto.admin.UserGrowthPoint;
import com.brandonkamga.lescracks.repository.*;
import com.brandonkamga.lescracks.service.interfaces.StatsService;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Date;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
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

    @Override
    public StatsOverviewResponse overview() {
        var userRows = users.findAll();
        var eventRows = events.findAll();
        var resourceRows = resources.findAll();
        return new StatsOverviewResponse(
                userRows.size(), group(userRows, user -> user.getStatus().name()),
                eventRows.size(), group(eventRows, event -> event.getStatus().name()),
                resourceRows.size(), group(resourceRows, resource -> resource.getStatus().name()),
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

    private <T> Map<String, Long> group(Iterable<T> rows, Function<T, String> key) {
        return java.util.stream.StreamSupport.stream(rows.spliterator(), false)
                .collect(Collectors.groupingBy(key, Collectors.counting()));
    }
}
