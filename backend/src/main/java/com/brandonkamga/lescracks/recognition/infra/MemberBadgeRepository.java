package com.brandonkamga.lescracks.recognition.infra;

import com.brandonkamga.lescracks.recognition.domain.MemberBadge;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface MemberBadgeRepository extends JpaRepository<MemberBadge, Long> {

    boolean existsByBadgeIdAndUserId(Long badgeId, Long userId);

    Optional<MemberBadge> findByBadgeIdAndUserId(Long badgeId, Long userId);

    List<MemberBadge> findByUserIdOrderByAwardedAtDesc(Long userId);

    List<MemberBadge> findByBadgeIdOrderByAwardedAtDesc(Long badgeId);

    /** (badge id, holders) for the whole catalogue in one query. */
    @Query("select m.badge.id, count(m) from MemberBadge m group by m.badge.id")
    List<Object[]> countHoldersByBadge();
}
