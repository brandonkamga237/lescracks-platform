package com.brandonkamga.lescracks.newsletter.application;

import com.brandonkamga.lescracks.newsletter.domain.model.Subscriber;
import com.brandonkamga.lescracks.newsletter.domain.model.SubscriptionStatus;
import com.brandonkamga.lescracks.newsletter.domain.port.SubscriberStore;

import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicLong;

/** Keeps copies, like the database: a subscriber changed but never saved stays as it was here. */
class InMemorySubscriberStore implements SubscriberStore {

    private final Map<Long, Subscriber> rows = new LinkedHashMap<>();
    private final AtomicLong ids = new AtomicLong();

    Subscriber stored(String email) {
        return findByEmail(email).orElseThrow();
    }

    @Override
    public Optional<Subscriber> findById(Long id) {
        return Optional.ofNullable(rows.get(id)).map(row -> row.toBuilder().build());
    }

    @Override
    public Optional<Subscriber> findByEmail(String email) {
        return rows.values().stream().filter(row -> row.getEmail().equalsIgnoreCase(email.trim())).findFirst().map(row -> row.toBuilder().build());
    }

    @Override
    public Optional<Subscriber> findByToken(String token) {
        return rows.values().stream().filter(row -> row.getToken().equals(token)).findFirst().map(row -> row.toBuilder().build());
    }

    @Override
    public List<Subscriber> findAll(SubscriptionStatus status) {
        return rows.values().stream().filter(row -> status == null || row.getStatus() == status)
                .sorted(Comparator.comparing(Subscriber::getId).reversed()).map(row -> row.toBuilder().build()).toList();
    }

    @Override
    public Subscriber save(Subscriber subscriber) {
        Subscriber row = subscriber.toBuilder().build();
        if (row.getId() == null) row.setId(ids.incrementAndGet());
        rows.put(row.getId(), row);
        return row.toBuilder().build();
    }
}
