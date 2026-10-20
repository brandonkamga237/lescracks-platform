package com.brandonkamga.lescracks.recognition.domain;

import java.util.List;
import java.util.Map;

/** The badge catalogue and who holds what. */
public interface BadgeService {

    List<Badge> catalogue();

    /** Holders per badge id, for the catalogue. */
    Map<Long, Long> holderCounts();

    Badge create(BadgeDraft draft);

    /** Only custom badges change; system badges keep the wording their rules rely on. */
    Badge update(Long id, BadgeDraft draft);

    void delete(Long id);

    /** Awards once: a member who already holds the badge keeps their first award. */
    MemberBadge award(String code, Long userId, String reason);

    MemberBadge awardByEmail(Long badgeId, String email, String reason);

    void revoke(Long badgeId, Long userId);

    List<MemberBadge> badgesOf(Long userId);

    List<MemberBadge> mine(String email);

    List<BadgeHolder> holders(Long badgeId);
}
