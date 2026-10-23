package com.brandonkamga.lescracks.recognition.application;

import com.brandonkamga.lescracks.recognition.domain.model.Badge;
import com.brandonkamga.lescracks.recognition.domain.model.MemberBadge;
import com.brandonkamga.lescracks.recognition.domain.port.AwardStore;
import com.brandonkamga.lescracks.recognition.domain.port.BadgeStore;
import com.brandonkamga.lescracks.event.application.RegistrationService;
import com.brandonkamga.lescracks.event.domain.model.RegistrationStatus;
import com.brandonkamga.lescracks.mail.domain.BadgeAwardedEmail;
import com.brandonkamga.lescracks.mail.domain.Mailer;
import com.brandonkamga.lescracks.member.application.Member;
import com.brandonkamga.lescracks.member.application.MemberDirectory;
import com.brandonkamga.lescracks.shared.exception.BadRequestException;
import com.brandonkamga.lescracks.shared.exception.NotFoundException;
import com.brandonkamga.lescracks.shared.util.Slugs;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

public class BadgeServiceImpl implements BadgeService {
    private static final Logger log = LoggerFactory.getLogger(BadgeServiceImpl.class);

    private final BadgeStore badges;
    private final AwardStore awards;
    private final MemberDirectory people;
    private final RegistrationService registrations;
    private final Mailer mailer;

    public BadgeServiceImpl(BadgeStore badges, AwardStore awards, MemberDirectory people, RegistrationService registrations,
                            Mailer mailer) {
        this.badges = badges;
        this.awards = awards;
        this.people = people;
        this.registrations = registrations;
        this.mailer = mailer;
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
        Badge badge = require(badgeId);
        String why = clean(reason);
        if (!awards.addAll(badge, List.of(member.getId()), why).isEmpty()) notify(badge, member, why);
        return awards.find(badge.getId(), member.getId()).orElseThrow();
    }

    @Override
    public BulkAward awardMany(Long badgeId, BadgeGrant grant) {
        Badge badge = require(badgeId);
        Map<Long, Member> recipients = new LinkedHashMap<>();
        List<String> unknown = new ArrayList<>();
        List<String> emails = grant.emails() == null ? List.of() : grant.emails().stream()
                .map(email -> email.trim().toLowerCase(Locale.ROOT)).filter(email -> !email.isEmpty()).distinct().toList();
        Map<String, Member> byEmail = people.findAllByEmail(emails);
        for (String email : emails) {
            Member member = byEmail.get(email);
            if (member == null) unknown.add(email);
            else recipients.put(member.getId(), member);
        }
        if (grant.eventId() != null) {
            registrations.listForEvent(grant.eventId()).stream()
                    .filter(view -> grant.presentOnly()
                            ? view.registration().getStatus() == RegistrationStatus.ATTENDED
                            : view.registration().isActive())
                    .forEach(view -> recipients.putIfAbsent(view.member().getId(), view.member()));
        }
        if (recipients.isEmpty() && unknown.isEmpty()) throw new BadRequestException("Indique au moins un email ou un événement.");
        String why = clean(grant.reason());
        Set<Long> added = awards.addAll(badge, recipients.keySet(), why);
        added.forEach(id -> notify(badge, recipients.get(id), why));
        log.info("Badge {} given to {} members ({} already held it)", badge.getCode(), added.size(), recipients.size() - added.size());
        return new BulkAward(added.size(), recipients.size() - added.size(), unknown);
    }

    private void notify(Badge badge, Member member, String reason) {
        mailer.send(new BadgeAwardedEmail(member.getEmail(), member.getFirstName(), badge.getName(), badge.getDescription(), reason,
                member.getId()));
    }

    private static String clean(String reason) {
        return reason == null || reason.isBlank() ? null : reason.trim();
    }

    // Rules give badges silently: the attestation that earned it already sends its own email.
    private MemberBadge give(Badge badge, Long userId, String reason) {
        MemberBadge award = awards.add(MemberBadge.builder().badge(badge).userId(userId).reason(clean(reason)).build());
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
