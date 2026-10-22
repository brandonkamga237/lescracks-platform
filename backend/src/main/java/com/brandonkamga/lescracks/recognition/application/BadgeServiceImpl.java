package com.brandonkamga.lescracks.recognition.application;

import com.brandonkamga.lescracks.recognition.domain.model.Badge;
import com.brandonkamga.lescracks.recognition.domain.model.MemberBadge;
import com.brandonkamga.lescracks.recognition.domain.port.AwardStore;
import com.brandonkamga.lescracks.recognition.domain.port.BadgeStore;
import com.brandonkamga.lescracks.member.application.Member;
import com.brandonkamga.lescracks.member.application.MemberDirectory;
import com.brandonkamga.lescracks.shared.exception.BadRequestException;
import com.brandonkamga.lescracks.shared.exception.NotFoundException;
import com.brandonkamga.lescracks.shared.util.Slugs;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;
import java.util.Locale;
import java.util.Map;

public class BadgeServiceImpl implements BadgeService {
    private static final Logger log = LoggerFactory.getLogger(BadgeServiceImpl.class);

    private final BadgeStore badges;
    private final AwardStore awards;
    private final MemberDirectory people;

    public BadgeServiceImpl(BadgeStore badges, AwardStore awards, MemberDirectory people) {
        this.badges = badges;
        this.awards = awards;
        this.people = people;
    }

    @Override
    public List<Badge> listCatalogue() {
        return badges.findAll();
    }

    @Override
    public Map<Long, Long> countHolders() {
        return badges.countHolders();
    }

    @Override
    public Badge create(BadgeDraft draft) {
        String code = "CUSTOM_" + Slugs.uniqueFrom(draft.name(), candidate -> badges.codeTaken("CUSTOM_" + candidate.toUpperCase(Locale.ROOT)))
                .toUpperCase(Locale.ROOT);
        Badge badge = badges.save(Badge.builder().code(code).name(draft.name().trim()).description(draft.description().trim())
                .icon(Badge.checkedIcon(draft.icon())).build());
        log.info("Badge {} created", code);
        return badge;
    }

    @Override
    public Badge update(Long id, BadgeDraft draft) {
        Badge badge = require(id);
        badge.edit(draft.name(), draft.description(), draft.icon());
        return badges.save(badge);
    }

    @Override
    public void delete(Long id) {
        require(id).checkDeletable();
        badges.delete(id);
    }

    @Override
    public MemberBadge award(String code, Long userId, String reason) {
        Badge badge = badges.findByCode(code).orElseThrow(() -> new NotFoundException("Badge", "code", code));
        return give(badge, userId, reason);
    }

    @Override
    public MemberBadge awardByEmail(Long badgeId, String email, String reason) {
        Member member = people.find(email).orElseThrow(() -> new BadRequestException("Aucun membre n’a l’adresse " + email + "."));
        return give(require(badgeId), member.getId(), reason);
    }

    private MemberBadge give(Badge badge, Long userId, String reason) {
        MemberBadge award = awards.add(MemberBadge.builder().badge(badge).userId(userId)
                .reason(reason == null || reason.isBlank() ? null : reason.trim()).build());
        log.info("Badge {} held by member {}", badge.getCode(), userId);
        return award;
    }

    @Override
    public void revoke(Long badgeId, Long userId) {
        awards.delete(badgeId, userId);
    }

    @Override
    public List<MemberBadge> listOf(Long userId) {
        return awards.findByUser(userId);
    }

    @Override
    public List<MemberBadge> listMine(String email) {
        return listOf(people.require(email).getId());
    }

    @Override
    public List<BadgeHolder> listHolders(Long badgeId) {
        List<MemberBadge> list = awards.findByBadge(require(badgeId).getId());
        Map<Long, Member> members = people.findAll(list.stream().map(MemberBadge::getUserId).toList());
        return list.stream().filter(award -> members.containsKey(award.getUserId()))
                .map(award -> new BadgeHolder(award, members.get(award.getUserId()))).toList();
    }

    private Badge require(Long id) {
        return badges.findById(id).orElseThrow(() -> new NotFoundException("Badge", "id", id));
    }
}
