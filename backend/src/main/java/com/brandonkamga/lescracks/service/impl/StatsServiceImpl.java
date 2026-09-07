package com.brandonkamga.lescracks.service.impl;

import com.brandonkamga.lescracks.domain.NewsletterStatus;
import com.brandonkamga.lescracks.dto.admin.StatsOverviewResponse;
import com.brandonkamga.lescracks.repository.*;
import com.brandonkamga.lescracks.service.interfaces.StatsService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
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

    private <T> Map<String, Long> group(Iterable<T> rows, Function<T, String> key) {
        return java.util.stream.StreamSupport.stream(rows.spliterator(), false)
                .collect(Collectors.groupingBy(key, Collectors.counting()));
    }
}