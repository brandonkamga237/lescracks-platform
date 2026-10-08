package com.brandonkamga.lescracks.cracklab.infra;

import com.brandonkamga.lescracks.cracklab.domain.Challenge;
import com.brandonkamga.lescracks.cracklab.domain.ChallengeDifficulty;
import com.brandonkamga.lescracks.cracklab.domain.ChallengeStatus;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface ChallengeRepository extends JpaRepository<Challenge, Long> {

    @Query("select c.id from Challenge c where c.status = :status and c.scheduledAt <= :now order by c.scheduledAt")
    List<Long> findScheduledIds(@Param("status") ChallengeStatus status, @Param("now") Instant now);

    Optional<Challenge> findBySlug(String slug);

    boolean existsBySlug(String slug);

    /** Each filter is optional: a null value lets every challenge through on that axis. */
    @Query("""
            SELECT c FROM Challenge c
            WHERE c.status = :status
              AND (:difficulty IS NULL OR c.difficulty = :difficulty)
              AND (:category IS NULL OR c.category = :category)
              AND (:tag IS NULL OR :tag MEMBER OF c.tags)
            """)
    Page<Challenge> search(@Param("status") ChallengeStatus status,
                           @Param("difficulty") ChallengeDifficulty difficulty,
                           @Param("category") String category,
                           @Param("tag") String tag,
                           Pageable pageable);
}
