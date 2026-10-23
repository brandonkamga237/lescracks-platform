package com.brandonkamga.lescracks.recognition.infra.persistence;

import com.brandonkamga.lescracks.recognition.domain.model.Badge;
import com.brandonkamga.lescracks.recognition.domain.model.MemberBadge;
import com.brandonkamga.lescracks.recognition.domain.port.AwardStore;

import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Component;

import java.util.Collection;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.Optional;

import static com.brandonkamga.lescracks.shared.persistence.JdbcValues.at;
import static com.brandonkamga.lescracks.shared.persistence.JdbcValues.instant;

@Component
class JdbcAwardStore implements AwardStore {

    private static final String SELECT = "SELECT m.id AS award_id, m.user_id, m.reason, m.awarded_at, " + JdbcBadgeStore.COLUMNS
            + " FROM member_badges m JOIN badges b ON b.id = m.badge_id";

    private static final RowMapper<MemberBadge> ROW = (row, number) -> MemberBadge.builder()
            .id(row.getLong("award_id"))
            .badge(JdbcBadgeStore.ROW.mapRow(row, number))
            .userId(row.getLong("user_id"))
            .reason(row.getString("reason"))
            .awardedAt(instant(row, "awarded_at"))
            .build();

    private final JdbcClient jdbc;

    JdbcAwardStore(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public Optional<MemberBadge> find(Long badgeId, Long userId) {
        return jdbc.sql(SELECT + " WHERE m.badge_id = :badge AND m.user_id = :user")
                .param("badge", badgeId).param("user", userId).query(ROW).optional();
    }

    @Override
    public List<MemberBadge> findByUser(Long userId) {
        return jdbc.sql(SELECT + " WHERE m.user_id = :user ORDER BY m.awarded_at DESC, m.id DESC").param("user", userId).query(ROW).list();
    }

    @Override
    public List<MemberBadge> findByBadge(Long badgeId) {
        return jdbc.sql(SELECT + " WHERE m.badge_id = :badge ORDER BY m.awarded_at DESC, m.id DESC").param("badge", badgeId).query(ROW).list();
    }

    @Override
    public MemberBadge add(MemberBadge award) {
        jdbc.sql("""
                        INSERT INTO member_badges (badge_id, user_id, reason, awarded_at) VALUES (:badge, :user, :reason, :awardedAt)
                        ON CONFLICT (badge_id, user_id) DO NOTHING""")
                .param("badge", award.getBadge().getId()).param("user", award.getUserId()).param("reason", award.getReason())
                .param("awardedAt", at(award.getAwardedAt())).update();
        return find(award.getBadge().getId(), award.getUserId()).orElseThrow();
    }

    @Override
    public Set<Long> addAll(Badge badge, Collection<Long> userIds, String reason) {
        if (userIds.isEmpty()) return Set.of();
        return new HashSet<>(jdbc.sql("""
                        INSERT INTO member_badges (badge_id, user_id, reason)
                        SELECT :badge, unnest(CAST(:users AS BIGINT[])), :reason
                        ON CONFLICT (badge_id, user_id) DO NOTHING
                        RETURNING user_id""")
                .param("badge", badge.getId()).param("users", userIds.toArray(Long[]::new)).param("reason", reason)
                .query(Long.class).list());
    }

    @Override
    public void delete(Long badgeId, Long userId) {
        jdbc.sql("DELETE FROM member_badges WHERE badge_id = :badge AND user_id = :user").param("badge", badgeId).param("user", userId).update();
    }
}
