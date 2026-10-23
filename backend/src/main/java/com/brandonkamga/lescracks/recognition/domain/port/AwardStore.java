package com.brandonkamga.lescracks.recognition.domain.port;

import com.brandonkamga.lescracks.recognition.domain.model.Badge;
import com.brandonkamga.lescracks.recognition.domain.model.MemberBadge;

import java.util.Collection;
import java.util.List;
import java.util.Set;
import java.util.Optional;

/** Who holds which badge; each award comes back with its badge, read in the same query. */
public interface AwardStore {

    Optional<MemberBadge> find(Long badgeId, Long userId);

    /** Latest first. */
    List<MemberBadge> findByUser(Long userId);

    /** Latest first. */
    List<MemberBadge> findByBadge(Long badgeId);

    /** Keeps the first award when the member already holds the badge, and returns the one that stands. */
    MemberBadge add(MemberBadge award);

    /** One statement for many members; those who already hold the badge are skipped. Returns who got it now. */
    Set<Long> addAll(Badge badge, Collection<Long> userIds, String reason);

    void delete(Long badgeId, Long userId);
}
