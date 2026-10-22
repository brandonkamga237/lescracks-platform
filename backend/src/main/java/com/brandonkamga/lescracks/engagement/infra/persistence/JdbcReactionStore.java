package com.brandonkamga.lescracks.engagement.infra.persistence;

import com.brandonkamga.lescracks.engagement.domain.model.Counts;
import com.brandonkamga.lescracks.engagement.domain.model.Target;
import com.brandonkamga.lescracks.engagement.domain.model.TargetType;
import com.brandonkamga.lescracks.engagement.domain.port.ReactionStore;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Component;

import java.util.Collection;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.Map;

/** Each reaction is one statement: the row and its counter change together, without a read first. */
@Component
class JdbcReactionStore implements ReactionStore {

    private final JdbcClient jdbc;

    JdbcReactionStore(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public boolean addView(Target target, String visitorKey) {
        return jdbc.sql("""
                WITH added AS (
                    INSERT INTO content_views (target_type, target_id, visitor_key) VALUES (:type, :id, :visitor)
                    ON CONFLICT DO NOTHING RETURNING 1)
                INSERT INTO engagement_counters (target_type, target_id, view_count)
                SELECT :type, :id, 1 FROM added
                ON CONFLICT (target_type, target_id) DO UPDATE SET view_count = engagement_counters.view_count + 1""")
                .param("type", target.type().name()).param("id", target.id()).param("visitor", visitorKey)
                .update() == 1;
    }

    @Override
    public boolean addLike(Target target, Long accountId) {
        return jdbc.sql("""
                WITH added AS (
                    INSERT INTO content_likes (target_type, target_id, account_id) VALUES (:type, :id, :account)
                    ON CONFLICT DO NOTHING RETURNING 1)
                INSERT INTO engagement_counters (target_type, target_id, like_count)
                SELECT :type, :id, 1 FROM added
                ON CONFLICT (target_type, target_id) DO UPDATE SET like_count = engagement_counters.like_count + 1""")
                .param("type", target.type().name()).param("id", target.id()).param("account", accountId)
                .update() == 1;
    }

    @Override
    public boolean removeLike(Target target, Long accountId) {
        return jdbc.sql("""
                WITH removed AS (
                    DELETE FROM content_likes WHERE target_type = :type AND target_id = :id AND account_id = :account RETURNING 1)
                UPDATE engagement_counters SET like_count = like_count - 1
                WHERE target_type = :type AND target_id = :id AND EXISTS (SELECT 1 FROM removed)""")
                .param("type", target.type().name()).param("id", target.id()).param("account", accountId)
                .update() == 1;
    }

    @Override
    public boolean hasLiked(Target target, Long accountId) {
        return jdbc.sql("SELECT EXISTS (SELECT 1 FROM content_likes WHERE target_type = :type AND target_id = :id AND account_id = :account)")
                .param("type", target.type().name()).param("id", target.id()).param("account", accountId)
                .query(Boolean.class).single();
    }

    @Override
    public Counts counts(Target target) {
        return jdbc.sql("SELECT view_count, like_count FROM engagement_counters WHERE target_type = :type AND target_id = :id")
                .param("type", target.type().name()).param("id", target.id())
                .query((row, number) -> new Counts(row.getInt("view_count"), row.getInt("like_count")))
                .optional().orElse(Counts.NONE);
    }

    @Override
    public Map<Long, Counts> counts(TargetType type, Collection<Long> ids) {
        Map<Long, Counts> counts = new HashMap<>();
        if (ids.isEmpty()) return counts;
        jdbc.sql("SELECT target_id, view_count, like_count FROM engagement_counters WHERE target_type = :type AND target_id IN (:ids)")
                .param("type", type.name()).param("ids", ids)
                .query(row -> { counts.put(row.getLong("target_id"), new Counts(row.getInt("view_count"), row.getInt("like_count"))); });
        return counts;
    }

    @Override
    public Map<Long, Counts> mostLiked(TargetType type, int limit) {
        Map<Long, Counts> ranked = new LinkedHashMap<>();
        jdbc.sql("SELECT target_id, view_count, like_count FROM engagement_counters WHERE target_type = :type AND like_count > 0 "
                        + "ORDER BY like_count DESC, target_id LIMIT :limit")
                .param("type", type.name()).param("limit", limit)
                .query(row -> { ranked.put(row.getLong("target_id"), new Counts(row.getInt("view_count"), row.getInt("like_count"))); });
        return ranked;
    }

    @Override
    public void forget(Target target) {
        for (String table : new String[] {"content_views", "content_likes", "engagement_counters"}) {
            jdbc.sql("DELETE FROM " + table + " WHERE target_type = :type AND target_id = :id")
                    .param("type", target.type().name()).param("id", target.id()).update();
        }
    }
}
