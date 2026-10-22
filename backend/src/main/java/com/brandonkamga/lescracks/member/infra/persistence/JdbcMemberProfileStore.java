package com.brandonkamga.lescracks.member.infra.persistence;

import com.brandonkamga.lescracks.member.domain.model.MemberGoal;
import com.brandonkamga.lescracks.member.domain.model.MemberProfile;
import com.brandonkamga.lescracks.member.domain.model.MemberSituation;
import com.brandonkamga.lescracks.member.domain.port.MemberProfileStore;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Component;

import java.util.Collection;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

import static com.brandonkamga.lescracks.shared.persistence.JdbcValues.at;
import static com.brandonkamga.lescracks.shared.persistence.JdbcValues.enumOf;
import static com.brandonkamga.lescracks.shared.persistence.JdbcValues.instant;
import static com.brandonkamga.lescracks.shared.persistence.JdbcValues.name;

/** A profile is two reads (the row, its interests) for one member or for a whole page of them. */
@Component
class JdbcMemberProfileStore implements MemberProfileStore {

    private static final String COLUMNS = """
            account_id, username, avatar_url, bio, location, social_links::text AS social_links,
            public_bio, public_location, public_links, phone, country, situation, goal,
            marketing_consent, onboarded_at, created_at, updated_at""";

    private static final TypeReference<Map<String, String>> LINKS = new TypeReference<>() { };

    private final JdbcClient jdbc;
    private final ObjectMapper json;
    private final RowMapper<MemberProfile> row;

    JdbcMemberProfileStore(JdbcClient jdbc, ObjectMapper json) {
        this.jdbc = jdbc;
        this.json = json;
        this.row = (rs, number) -> MemberProfile.builder()
                .accountId(rs.getLong("account_id"))
                .username(rs.getString("username"))
                .avatarUrl(rs.getString("avatar_url"))
                .bio(rs.getString("bio"))
                .location(rs.getString("location"))
                .socialLinks(links(rs.getString("social_links")))
                .publicBio(rs.getBoolean("public_bio"))
                .publicLocation(rs.getBoolean("public_location"))
                .publicLinks(rs.getBoolean("public_links"))
                .phone(rs.getString("phone"))
                .country(rs.getString("country"))
                .situation(enumOf(rs, "situation", MemberSituation.class))
                .goal(enumOf(rs, "goal", MemberGoal.class))
                .marketingConsent(rs.getBoolean("marketing_consent"))
                .onboardedAt(instant(rs, "onboarded_at"))
                .createdAt(instant(rs, "created_at"))
                .updatedAt(instant(rs, "updated_at"))
                .interests(new HashSet<>())
                .build();
    }

    @Override
    public Optional<MemberProfile> find(Long accountId) {
        return findAll(List.of(accountId)).stream().findFirst();
    }

    @Override
    public List<MemberProfile> findAll(Collection<Long> accountIds) {
        if (accountIds.isEmpty()) return List.of();
        List<MemberProfile> profiles = jdbc.sql("SELECT " + COLUMNS + " FROM member_profiles WHERE account_id IN (:ids)")
                .param("ids", accountIds).query(row).list();
        if (profiles.isEmpty()) return profiles;
        Map<Long, MemberProfile> byAccount = new HashMap<>();
        profiles.forEach(profile -> byAccount.put(profile.getAccountId(), profile));
        jdbc.sql("SELECT account_id, category_id FROM member_interests WHERE account_id IN (:ids)")
                .param("ids", byAccount.keySet())
                .query(rs -> { byAccount.get(rs.getLong("account_id")).getInterests().add(rs.getLong("category_id")); });
        return profiles;
    }

    @Override
    public MemberProfile save(MemberProfile profile) {
        jdbc.sql("""
                INSERT INTO member_profiles (account_id, username, avatar_url, bio, location, social_links,
                        public_bio, public_location, public_links, phone, country, situation, goal,
                        marketing_consent, onboarded_at, created_at, updated_at)
                VALUES (:account, :username, :avatarUrl, :bio, :location, CAST(:links AS jsonb),
                        :publicBio, :publicLocation, :publicLinks, :phone, :country, :situation, :goal,
                        :marketingConsent, :onboardedAt, :createdAt, :updatedAt)
                ON CONFLICT (account_id) DO UPDATE SET
                        username = EXCLUDED.username, avatar_url = EXCLUDED.avatar_url, bio = EXCLUDED.bio,
                        location = EXCLUDED.location, social_links = EXCLUDED.social_links,
                        public_bio = EXCLUDED.public_bio, public_location = EXCLUDED.public_location,
                        public_links = EXCLUDED.public_links, phone = EXCLUDED.phone, country = EXCLUDED.country,
                        situation = EXCLUDED.situation, goal = EXCLUDED.goal,
                        marketing_consent = EXCLUDED.marketing_consent, onboarded_at = EXCLUDED.onboarded_at,
                        updated_at = EXCLUDED.updated_at""")
                .param("account", profile.getAccountId())
                .param("username", profile.getUsername())
                .param("avatarUrl", profile.getAvatarUrl())
                .param("bio", profile.getBio())
                .param("location", profile.getLocation())
                .param("links", toJson(profile.getSocialLinks()))
                .param("publicBio", profile.isPublicBio())
                .param("publicLocation", profile.isPublicLocation())
                .param("publicLinks", profile.isPublicLinks())
                .param("phone", profile.getPhone())
                .param("country", profile.getCountry())
                .param("situation", name(profile.getSituation()))
                .param("goal", name(profile.getGoal()))
                .param("marketingConsent", profile.isMarketingConsent())
                .param("onboardedAt", at(profile.getOnboardedAt()))
                .param("createdAt", at(profile.getCreatedAt()))
                .param("updatedAt", at(profile.getUpdatedAt()))
                .update();
        saveInterests(profile.getAccountId(), profile.getInterests() == null ? Set.of() : profile.getInterests());
        return profile.toBuilder().interests(new HashSet<>(profile.getInterests() == null ? Set.of() : profile.getInterests())).build();
    }

    /** Two statements whatever the number of interests: drop what left, add what came. */
    private void saveInterests(Long accountId, Set<Long> interests) {
        Long[] ids = interests.toArray(Long[]::new);
        jdbc.sql("DELETE FROM member_interests WHERE account_id = :account AND NOT (category_id = ANY(:ids))")
                .param("account", accountId).param("ids", ids).update();
        if (ids.length == 0) return;
        jdbc.sql("INSERT INTO member_interests (account_id, category_id) SELECT :account, unnest(:ids) ON CONFLICT DO NOTHING")
                .param("account", accountId).param("ids", ids).update();
    }

    private Map<String, String> links(String raw) {
        if (raw == null || raw.isBlank()) return new HashMap<>();
        try {
            return new HashMap<>(json.readValue(raw, LINKS));
        } catch (JsonProcessingException unreadable) {
            throw new IllegalStateException("Unreadable social_links", unreadable);
        }
    }

    private String toJson(Map<String, String> links) {
        try {
            return json.writeValueAsString(links == null ? Map.of() : links);
        } catch (JsonProcessingException unwritable) {
            throw new IllegalStateException("Unwritable social_links", unwritable);
        }
    }
}
