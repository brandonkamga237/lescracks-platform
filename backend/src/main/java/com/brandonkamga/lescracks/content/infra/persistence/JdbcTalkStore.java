package com.brandonkamga.lescracks.content.infra.persistence;

import com.brandonkamga.lescracks.content.domain.model.Talk;
import com.brandonkamga.lescracks.content.domain.model.TalkStatus;
import com.brandonkamga.lescracks.content.domain.port.TalkStore;
import com.brandonkamga.lescracks.shared.paging.PageQuery;
import com.brandonkamga.lescracks.shared.paging.Paged;

import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static com.brandonkamga.lescracks.shared.persistence.JdbcValues.at;
import static com.brandonkamga.lescracks.shared.persistence.JdbcValues.enumOf;
import static com.brandonkamga.lescracks.shared.persistence.JdbcValues.instant;

@Component
class JdbcTalkStore implements TalkStore {

    private static final String COLUMNS = """
            id, title, description, guest, youtube_url, cover_image, duration_minutes, published_at, status, created_at, updated_at""";

    private static final RowMapper<Talk> ROW = (row, number) -> Talk.builder()
            .id(row.getLong("id"))
            .title(row.getString("title"))
            .description(row.getString("description"))
            .guest(row.getString("guest"))
            .youtubeUrl(row.getString("youtube_url"))
            .coverImage(row.getString("cover_image"))
            .durationMinutes((Integer) row.getObject("duration_minutes"))
            .publishedAt(instant(row, "published_at"))
            .status(enumOf(row, "status", TalkStatus.class))
            .createdAt(instant(row, "created_at"))
            .updatedAt(instant(row, "updated_at"))
            .build();

    private final JdbcClient jdbc;

    JdbcTalkStore(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public Paged<Talk> findAll(TalkStatus status, PageQuery page) {
        String where = status == null ? "" : " WHERE status = '" + status.name() + "'";
        List<Long> totals = new ArrayList<>();
        List<Talk> found = jdbc.sql("SELECT " + COLUMNS + ", count(*) OVER () AS total FROM talk_videos" + where
                        + (status == null ? " ORDER BY created_at DESC" : " ORDER BY published_at DESC NULLS LAST") + ", id DESC LIMIT :limit OFFSET :offset")
                .param("limit", page.size()).param("offset", (long) page.page() * page.size())
                .query((row, number) -> {
                    if (number == 0) totals.add(row.getLong("total"));
                    return ROW.mapRow(row, number);
                }).list();
        long total = !totals.isEmpty() ? totals.get(0) : page.page() == 0 ? 0
                : jdbc.sql("SELECT count(*) FROM talk_videos" + where).query(Long.class).single();
        return new Paged<>(found, page.page(), page.size(), total);
    }

    @Override
    public Optional<Talk> findById(Long id) {
        return jdbc.sql("SELECT " + COLUMNS + " FROM talk_videos WHERE id = :id").param("id", id).query(ROW).optional();
    }

    @Override
    public Talk save(Talk talk) {
        var statement = talk.getId() == null
                ? jdbc.sql("""
                        INSERT INTO talk_videos (title, description, guest, youtube_url, cover_image, duration_minutes, published_at,
                                                 status, created_at, updated_at)
                        VALUES (:title, :description, :guest, :youtubeUrl, :cover, :duration, :publishedAt, :status, :createdAt, :updatedAt)
                        RETURNING id""").param("createdAt", at(talk.getCreatedAt()))
                : jdbc.sql("""
                        UPDATE talk_videos SET title = :title, description = :description, guest = :guest, youtube_url = :youtubeUrl,
                               cover_image = :cover, duration_minutes = :duration, published_at = :publishedAt, status = :status,
                               updated_at = :updatedAt
                        WHERE id = :id RETURNING id""").param("id", talk.getId());
        Long id = statement
                .param("title", talk.getTitle())
                .param("description", talk.getDescription())
                .param("guest", talk.getGuest())
                .param("youtubeUrl", talk.getYoutubeUrl())
                .param("cover", talk.getCoverImage())
                .param("duration", talk.getDurationMinutes())
                .param("publishedAt", at(talk.getPublishedAt()))
                .param("status", talk.getStatus().name())
                .param("updatedAt", at(talk.getUpdatedAt()))
                .query(Long.class).single();
        return talk.toBuilder().id(id).build();
    }

    @Override
    public void delete(Long id) {
        jdbc.sql("DELETE FROM talk_videos WHERE id = :id").param("id", id).update();
    }
}
