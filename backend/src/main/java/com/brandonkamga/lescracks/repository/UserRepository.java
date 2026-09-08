package com.brandonkamga.lescracks.repository;

import com.brandonkamga.lescracks.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

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
}
