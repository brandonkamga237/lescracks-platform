package com.brandonkamga.lescracks.member.infra.persistence;

import com.brandonkamga.lescracks.member.application.MemberStatistics;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Component;

import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.Map;

@Component
class JdbcMemberStatistics implements MemberStatistics {

    private final JdbcClient jdbc;

    JdbcMemberStatistics(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public Map<String, Long> bySituation() {
        return grouped("situation");
    }

    @Override
    public Map<String, Long> byGoal() {
        return grouped("goal");
    }

    @Override
    public Map<String, Long> byCountry() {
        return grouped("country");
    }

    private Map<String, Long> grouped(String column) {
        Map<String, Long> counts = new LinkedHashMap<>();
        jdbc.sql("SELECT " + column + " AS k, count(*) AS n FROM member_profiles WHERE " + column + " IS NOT NULL GROUP BY " + column + " ORDER BY n DESC")
                .query(row -> { counts.put(row.getString("k"), row.getLong("n")); });
        return counts;
    }

    @Override
    public Map<Long, Long> byInterest() {
        Map<Long, Long> counts = new LinkedHashMap<>();
        jdbc.sql("SELECT category_id, count(*) AS n FROM member_interests GROUP BY category_id ORDER BY n DESC")
                .query(row -> { counts.put(row.getLong("category_id"), row.getLong("n")); });
        return counts;
    }

    @Override
    public long countOnboarded(Collection<Long> accountIds) {
        if (accountIds.isEmpty()) return 0;
        return jdbc.sql("SELECT count(*) FROM member_profiles WHERE onboarded_at IS NOT NULL AND account_id = ANY(:ids)")
                .param("ids", accountIds.toArray(Long[]::new)).query(Long.class).single();
    }
}
