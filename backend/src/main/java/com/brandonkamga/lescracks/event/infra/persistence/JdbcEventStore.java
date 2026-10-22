package com.brandonkamga.lescracks.event.infra.persistence;

import com.brandonkamga.lescracks.event.domain.model.Event;
import com.brandonkamga.lescracks.event.domain.model.EventFormat;
import com.brandonkamga.lescracks.event.domain.model.EventSearch;
import com.brandonkamga.lescracks.event.domain.model.EventStatus;
import com.brandonkamga.lescracks.event.domain.model.EventType;
import com.brandonkamga.lescracks.event.domain.port.EventStore;
import com.brandonkamga.lescracks.shared.paging.PageQuery;
import com.brandonkamga.lescracks.shared.paging.Paged;

import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static com.brandonkamga.lescracks.shared.persistence.JdbcValues.at;
import static com.brandonkamga.lescracks.shared.persistence.JdbcValues.enumOf;
import static com.brandonkamga.lescracks.shared.persistence.JdbcValues.instant;

@Component
class JdbcEventStore implements EventStore {

    private static final String COLUMNS = """
            id, slug, title, description, type, format, start_date, end_date, location, cover_image, status,
            accepts_submissions, max_team_size, submission_deadline, registration_count, scheduled_at, created_at, updated_at""";

    private static final RowMapper<Event> ROW = (row, number) -> Event.builder()
            .id(row.getLong("id"))
            .slug(row.getString("slug"))
            .title(row.getString("title"))
            .description(row.getString("description"))
            .type(enumOf(row, "type", EventType.class))
            .format(enumOf(row, "format", EventFormat.class))
            .startDate(instant(row, "start_date"))
            .endDate(instant(row, "end_date"))
            .location(row.getString("location"))
            .coverImage(row.getString("cover_image"))
            .status(enumOf(row, "status", EventStatus.class))
            .acceptsSubmissions(row.getBoolean("accepts_submissions"))
            .maxTeamSize(row.getInt("max_team_size"))
            .submissionDeadline(instant(row, "submission_deadline"))
            .registrationCount(row.getInt("registration_count"))
            .scheduledAt(instant(row, "scheduled_at"))
            .createdAt(instant(row, "created_at"))
            .updatedAt(instant(row, "updated_at"))
            .build();

    private final JdbcClient jdbc;

    JdbcEventStore(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public Optional<Event> findById(Long id) {
        return jdbc.sql("SELECT " + COLUMNS + " FROM events WHERE id = :id").param("id", id).query(ROW).optional();
    }

    @Override
    public Optional<Event> findBySlug(String slug) {
        return jdbc.sql("SELECT " + COLUMNS + " FROM events WHERE slug = :slug").param("slug", slug).query(ROW).optional();
    }

    @Override
    public boolean slugTaken(String slug) {
        return jdbc.sql("SELECT EXISTS (SELECT 1 FROM events WHERE slug = :slug)").param("slug", slug).query(Boolean.class).single();
    }

    @Override
    public Paged<Event> search(EventSearch search, PageQuery page, Instant now) {
        List<String> clauses = new ArrayList<>();
        Map<String, Object> params = new HashMap<>();
        if (search.status() != null) {
            clauses.add("status = :status");
            params.put("status", search.status().name());
        }
        if (search.type() != null) {
            clauses.add("type = :type");
            params.put("type", search.type().name());
        }
        if (search.format() != null) {
            clauses.add("format = :format");
            params.put("format", search.format().name());
        }
        switch (search.timing()) {
            case UPCOMING -> clauses.add("(start_date > :now OR end_date > :now)");
            case PAST -> clauses.add("start_date <= :now AND (end_date IS NULL OR end_date <= :now)");
            case ANY -> { }
        }
        if (search.timing() != EventSearch.Timing.ANY) params.put("now", at(now));
        String where = clauses.isEmpty() ? "" : " WHERE " + String.join(" AND ", clauses);
        params.put("limit", page.size());
        params.put("offset", (long) page.page() * page.size());
        List<Long> totals = new ArrayList<>();
        List<Event> found = jdbc.sql("SELECT " + COLUMNS + ", count(*) OVER () AS total FROM events" + where
                        + " ORDER BY start_date " + (search.newestFirst() ? "DESC" : "ASC") + ", id LIMIT :limit OFFSET :offset")
                .params(params)
                .query((row, number) -> {
                    if (number == 0) totals.add(row.getLong("total"));
                    return ROW.mapRow(row, number);
                }).list();
        long total = !totals.isEmpty() ? totals.get(0) : page.page() == 0 ? 0
                : jdbc.sql("SELECT count(*) FROM events" + where).params(params).query(Long.class).single();
        return new Paged<>(found, page.page(), page.size(), total);
    }

    @Override
    public List<Event> findAllById(Collection<Long> ids) {
        if (ids.isEmpty()) return List.of();
        return jdbc.sql("SELECT " + COLUMNS + " FROM events WHERE id IN (:ids)").param("ids", ids).query(ROW).list();
    }

    @Override
    public List<Long> findScheduledIds(Instant now) {
        return jdbc.sql("SELECT id FROM events WHERE status = 'DRAFT' AND scheduled_at <= :now ORDER BY scheduled_at")
                .param("now", at(now)).query(Long.class).list();
    }

    @Override
    public Event save(Event event) {
        Map<String, Object> params = new HashMap<>();
        params.put("slug", event.getSlug());
        params.put("title", event.getTitle());
        params.put("description", event.getDescription());
        params.put("type", event.getType().name());
        params.put("format", event.getFormat().name());
        params.put("start", at(event.getStartDate()));
        params.put("end", at(event.getEndDate()));
        params.put("location", event.getLocation());
        params.put("cover", event.getCoverImage());
        params.put("status", event.getStatus().name());
        params.put("acceptsSubmissions", event.isAcceptsSubmissions());
        params.put("maxTeamSize", event.getMaxTeamSize());
        params.put("deadline", at(event.getSubmissionDeadline()));
        params.put("scheduledAt", at(event.getScheduledAt()));
        params.put("updatedAt", at(event.getUpdatedAt()));
        if (event.getId() == null) {
            params.put("createdAt", at(event.getCreatedAt()));
            Long id = jdbc.sql("""
                    INSERT INTO events (slug, title, description, type, format, start_date, end_date, location, cover_image, status,
                                        accepts_submissions, max_team_size, submission_deadline, scheduled_at, created_at, updated_at)
                    VALUES (:slug, :title, :description, :type, :format, :start, :end, :location, :cover, :status,
                            :acceptsSubmissions, :maxTeamSize, :deadline, :scheduledAt, :createdAt, :updatedAt)
                    RETURNING id""").params(params).query(Long.class).single();
            return event.toBuilder().id(id).build();
        }
        params.put("id", event.getId());
        jdbc.sql("""
                UPDATE events SET slug = :slug, title = :title, description = :description, type = :type, format = :format,
                       start_date = :start, end_date = :end, location = :location, cover_image = :cover, status = :status,
                       accepts_submissions = :acceptsSubmissions, max_team_size = :maxTeamSize, submission_deadline = :deadline,
                       scheduled_at = :scheduledAt, updated_at = :updatedAt
                WHERE id = :id""").params(params).update();
        return event.toBuilder().build();
    }

    @Override
    public void delete(Long id) {
        jdbc.sql("DELETE FROM events WHERE id = :id").param("id", id).update();
    }
}
