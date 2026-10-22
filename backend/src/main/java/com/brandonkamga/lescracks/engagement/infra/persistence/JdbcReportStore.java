package com.brandonkamga.lescracks.engagement.infra.persistence;

import com.brandonkamga.lescracks.engagement.domain.port.ReportStore;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
class JdbcReportStore implements ReportStore {

    private final JdbcClient jdbc;

    JdbcReportStore(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public boolean exists(Long commentId, Long reporterId) {
        return jdbc.sql("SELECT EXISTS (SELECT 1 FROM comment_reports WHERE comment_id = :comment AND reporter_id = :reporter)")
                .param("comment", commentId).param("reporter", reporterId).query(Boolean.class).single();
    }

    @Override
    public void add(Long commentId, Long reporterId, String reason) {
        jdbc.sql("INSERT INTO comment_reports (comment_id, reporter_id, reason) VALUES (:comment, :reporter, :reason)")
                .param("comment", commentId).param("reporter", reporterId).param("reason", reason).update();
    }

    @Override
    public Map<Long, List<String>> reasonsOf(Collection<Long> commentIds) {
        Map<Long, List<String>> reasons = new HashMap<>();
        if (commentIds.isEmpty()) return reasons;
        jdbc.sql("SELECT comment_id, reason FROM comment_reports WHERE comment_id IN (:ids) AND reason IS NOT NULL ORDER BY created_at DESC")
                .param("ids", commentIds)
                .query(row -> { reasons.computeIfAbsent(row.getLong("comment_id"), id -> new ArrayList<>()).add(row.getString("reason")); });
        return reasons;
    }
}
