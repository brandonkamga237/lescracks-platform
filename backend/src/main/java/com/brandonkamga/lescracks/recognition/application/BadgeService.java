package com.brandonkamga.lescracks.recognition.application;

import com.brandonkamga.lescracks.recognition.domain.model.Badge;
import com.brandonkamga.lescracks.recognition.domain.model.MemberBadge;

import java.util.List;
import java.util.Map;

/** The badge catalogue and who holds what. */
public interface BadgeService {

    /** System badges first, then by name. */
    List<Badge> listCatalogue();

    /** Holders per badge id, for the catalogue. */
    Map<Long, Long> countHolders();

    Badge create(BadgeDraft draft);

    /** Only custom badges change; system badges keep the wording their rules rely on. */
    Badge update(Long id, BadgeDraft draft);

    void delete(Long id);

    /** Awards once: a member who already holds the badge keeps their first award. */
    MemberBadge award(String code, Long userId, String reason);

    /** By hand: the member gets an email, unless they already held it. */
    MemberBadge awardByEmail(Long badgeId, String email, String reason);

    /** Many members in one go; each new holder gets an email. */
    BulkAward awardMany(Long badgeId, BadgeGrant grant);

    void revoke(Long badgeId, Long userId);

    /** Latest first. */
    List<MemberBadge> listOf(Long userId);

    List<MemberBadge> listMine(String email);

    List<BadgeHolder> listHolders(Long badgeId);
}
