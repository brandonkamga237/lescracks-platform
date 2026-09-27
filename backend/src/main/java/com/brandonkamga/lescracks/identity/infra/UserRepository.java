package com.brandonkamga.lescracks.identity.infra;

import com.brandonkamga.lescracks.identity.domain.User;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmailIgnoreCase(String email);

    Page<User> findByEmailContainingIgnoreCaseOrFirstNameContainingIgnoreCaseOrLastNameContainingIgnoreCase(
            String email, String firstName, String lastName, Pageable pageable);

    @Query(value = """
            SELECT cast(created_at as date) as d, count(*) as c
            FROM users
            WHERE created_at >= :from AND created_at <= :to
            GROUP BY d
            ORDER BY d
            """, nativeQuery = true)
    List<Object[]> userGrowth(@Param("from") Instant from, @Param("to") Instant to);

    @Query("select u.status, count(u) from User u group by u.status")
    List<Object[]> countGroupedByStatus();

    @Query("select u.provider, count(u) from User u group by u.provider")
    List<Object[]> countGroupedByProvider();

    long countByEmailVerifiedTrue();

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
