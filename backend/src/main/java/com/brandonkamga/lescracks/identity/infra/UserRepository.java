package com.brandonkamga.lescracks.identity.infra;

import com.brandonkamga.lescracks.identity.domain.User;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long>, JpaSpecificationExecutor<User> {

    /**
     * A member can sign in (password, Google or GitHub). The other rows are newsletter-only
     * contacts from the public form: counting them as members inflated the totals and made
     * them look like accounts that never confirmed their address.
     */
    String MEMBER = "(u.passwordHash is not null or u.provider <> com.brandonkamga.lescracks.identity.domain.AuthProvider.LOCAL)";
    String MEMBER_SQL = "(password_hash is not null or provider <> 'LOCAL')";

    Optional<User> findByEmailIgnoreCase(String email);


    @Query(value = """
            SELECT cast(created_at as date) as d, count(*) as c
            FROM users
            WHERE created_at >= :from AND created_at <= :to AND """ + MEMBER_SQL + """
            GROUP BY d
            ORDER BY d
            """, nativeQuery = true)
    List<Object[]> userGrowth(@Param("from") Instant from, @Param("to") Instant to);

    @Query("select u.status, count(u) from User u where " + MEMBER + " group by u.status")
    List<Object[]> countMembersGroupedByStatus();

    @Query("select u.provider, count(u) from User u where " + MEMBER + " group by u.provider")
    List<Object[]> countMembersGroupedByProvider();

    @Query("select u.situation, count(u) from User u where u.situation is not null and " + MEMBER + " group by u.situation")
    List<Object[]> countMembersGroupedBySituation();

    @Query("select u.goal, count(u) from User u where u.goal is not null and " + MEMBER + " group by u.goal")
    List<Object[]> countMembersGroupedByGoal();

    @Query("select u.country, count(u) from User u where u.country is not null and " + MEMBER + " group by u.country")
    List<Object[]> countMembersGroupedByCountry();

    /** Members per interest, as category ids: identity keeps ids and never reaches into taxonomy. */
    @Query(value = "SELECT ui.category_id, count(*) FROM user_interests ui JOIN users ON users.id = ui.user_id WHERE "
            + MEMBER_SQL + " GROUP BY ui.category_id", nativeQuery = true)
    List<Object[]> countMembersGroupedByInterest();

    @Query("select count(u) from User u where u.emailVerified = true and " + MEMBER)
    long countVerifiedMembers();

    @Query("select count(u) from User u where not " + MEMBER)
    long countNewsletterContacts();

    @Query("select count(u) from User u where u.createdAt > :since and " + MEMBER)
    long countMembersCreatedAfter(@Param("since") Instant since);

    /**
     * Members who signed up since {@code since}: how many confirmed their address, answered or
     * skipped the welcome questions, and came back at least a day after signing up.
     */
    @Query(value = """
            SELECT count(*) AS signed_up,
                   count(*) FILTER (WHERE email_verified) AS verified,
                   count(*) FILTER (WHERE onboarded_at IS NOT NULL) AS onboarded,
                   count(*) FILTER (WHERE last_seen_at > created_at + INTERVAL '1 day') AS returned
            FROM users
            WHERE created_at > :since AND """ + MEMBER_SQL, nativeQuery = true)
    List<Object[]> signupFunnel(@Param("since") Instant since);

    long countByLastSeenAtAfter(Instant since);

    long countByCreatedAtAfter(Instant since);

    // Conditional update: one write per member per hour at most, no select needed.
    @Modifying
    @Transactional
    @Query("update User u set u.lastSeenAt = :now where lower(u.email) = lower(:email) "
            + "and (u.lastSeenAt is null or u.lastSeenAt < :staleBefore)")
    int touchLastSeen(@Param("email") String email, @Param("now") Instant now,
                      @Param("staleBefore") Instant staleBefore);
}
