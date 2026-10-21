package com.brandonkamga.lescracks.recognition.domain;

import com.brandonkamga.lescracks.identity.domain.User;
import com.brandonkamga.lescracks.identity.domain.UserDirectory;
import com.brandonkamga.lescracks.recognition.infra.BadgeRepository;
import com.brandonkamga.lescracks.recognition.infra.MemberBadgeRepository;
import com.brandonkamga.lescracks.shared.exception.BadRequestException;
import com.brandonkamga.lescracks.shared.exception.NotFoundException;
import com.brandonkamga.lescracks.shared.util.Slugs;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@Transactional
public class BadgeServiceImpl implements BadgeService {
    private static final Logger log = LoggerFactory.getLogger(BadgeServiceImpl.class);

    /** The icons the site knows how to draw; anything else would show as a blank circle. */
    static final Set<String> ICONS = Set.of("award", "trophy", "medal", "code", "calendar-check", "sparkles", "star",
            "flame", "heart", "rocket", "megaphone", "shield", "lightbulb", "users", "book-open");

    private final BadgeRepository badges;
    private final MemberBadgeRepository awards;
    private final UserDirectory people;

    public BadgeServiceImpl(BadgeRepository badges, MemberBadgeRepository awards, UserDirectory people) {
        this.badges = badges;
        this.awards = awards;
        this.people = people;
    }

    @Override
    @Transactional(readOnly = true)
    public List<Badge> catalogue() {
        return badges.findAllByOrderBySystemDescNameAsc();
    }

    @Override
    @Transactional(readOnly = true)
    public Map<Long, Long> holderCounts() {
        return awards.countHoldersByBadge().stream()
                .collect(Collectors.toMap(row -> ((Number) row[0]).longValue(), row -> ((Number) row[1]).longValue()));
    }

    @Override
    public Badge create(BadgeDraft draft) {
        String code = "CUSTOM_" + Slugs.uniqueFrom(draft.name(), candidate -> badges.existsByCode("CUSTOM_" + candidate.toUpperCase(Locale.ROOT)))
                .toUpperCase(Locale.ROOT);
        Badge badge = badges.save(Badge.builder().code(code).name(draft.name().trim()).description(draft.description().trim())
                .icon(icon(draft.icon())).build());
        log.info("Badge {} created", code);
        return badge;
    }

    @Override
    public Badge update(Long id, BadgeDraft draft) {
        Badge badge = require(id);
        if (badge.isSystem()) throw new BadRequestException("Un badge système ne se modifie pas : ses règles en dépendent.");
        badge.setName(draft.name().trim());
        badge.setDescription(draft.description().trim());
        badge.setIcon(icon(draft.icon()));
        return badge;
    }

    @Override
    public void delete(Long id) {
        Badge badge = require(id);
        if (badge.isSystem()) throw new BadRequestException("Un badge système ne se supprime pas.");
        badges.delete(badge);
    }

    @Override
    public MemberBadge award(String code, Long userId, String reason) {
        Badge badge = badges.findByCode(code).orElseThrow(() -> new NotFoundException("Badge", "code", code));
        return give(badge, userId, reason);
    }

    @Override
    public MemberBadge awardByEmail(Long badgeId, String email, String reason) {
        User member = people.find(email).orElseThrow(() -> new BadRequestException("Aucun membre n’a l’adresse " + email + "."));
        return give(require(badgeId), member.getId(), reason);
    }

    private MemberBadge give(Badge badge, Long userId, String reason) {
        return awards.findByBadgeIdAndUserId(badge.getId(), userId).orElseGet(() -> {
            log.info("Badge {} awarded to member {}", badge.getCode(), userId);
            return awards.save(MemberBadge.builder().badge(badge).userId(userId)
                    .reason(reason == null || reason.isBlank() ? null : reason.trim()).build());
        });
    }

    @Override
    public void revoke(Long badgeId, Long userId) {
        awards.findByBadgeIdAndUserId(badgeId, userId).ifPresent(awards::delete);
    }

    @Override
    @Transactional(readOnly = true)
    public List<MemberBadge> badgesOf(Long userId) {
        return awards.findByUserIdOrderByAwardedAtDesc(userId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<MemberBadge> mine(String email) {
        return badgesOf(people.require(email).getId());
    }

    @Override
    @Transactional(readOnly = true)
    public List<BadgeHolder> holders(Long badgeId) {
        List<MemberBadge> list = awards.findByBadgeIdOrderByAwardedAtDesc(require(badgeId).getId());
        Map<Long, User> members = people.findAll(list.stream().map(MemberBadge::getUserId).toList());
        return list.stream().filter(award -> members.containsKey(award.getUserId()))
                .map(award -> new BadgeHolder(award, members.get(award.getUserId()))).toList();
    }

    private Badge require(Long id) {
        return badges.findById(id).orElseThrow(() -> new NotFoundException("Badge", "id", id));
    }

    private static String icon(String icon) {
        String key = icon == null || icon.isBlank() ? "award" : icon.trim();
        if (!ICONS.contains(key)) throw new BadRequestException("Icône inconnue : " + key + ".");
        return key;
    }
}
