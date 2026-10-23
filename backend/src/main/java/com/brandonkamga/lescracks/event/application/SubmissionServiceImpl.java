package com.brandonkamga.lescracks.event.application;

import com.brandonkamga.lescracks.event.domain.model.Event;
import com.brandonkamga.lescracks.event.domain.model.Submission;
import com.brandonkamga.lescracks.event.domain.port.EventStore;
import com.brandonkamga.lescracks.event.domain.port.SubmissionStore;
import com.brandonkamga.lescracks.member.application.Member;
import com.brandonkamga.lescracks.member.application.MemberDirectory;
import com.brandonkamga.lescracks.shared.exception.BadRequestException;
import com.brandonkamga.lescracks.shared.exception.ConflictException;
import com.brandonkamga.lescracks.shared.exception.NotFoundException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

public class SubmissionServiceImpl implements SubmissionService {
    private static final Logger log = LoggerFactory.getLogger(SubmissionServiceImpl.class);

    private final SubmissionStore submissions;
    private final EventStore events;
    private final RegistrationService registrations;
    private final MemberDirectory people;

    public SubmissionServiceImpl(SubmissionStore submissions, EventStore events, RegistrationService registrations,
                                 MemberDirectory people) {
        this.submissions = submissions;
        this.events = events;
        this.registrations = registrations;
        this.people = people;
    }

    @Override
    public SubmissionView submit(Long eventId, String email, ProjectDraft draft) {
        Event event = requireEvent(eventId);
        if (!event.isPublished() || !event.isAcceptsSubmissions()) {
            throw new BadRequestException("Cet événement ne reçoit pas de projets.");
        }
        if (!event.takesProjectsAt(Instant.now())) throw new BadRequestException("Les soumissions sont closes.");

        Member owner = people.require(email);
        List<Member> teammates = teammates(draft.teammateEmails(), owner);
        if (1 + teammates.size() > event.getMaxTeamSize()) {
            throw new BadRequestException(event.getMaxTeamSize() == 1
                    ? "Les projets de cet événement sont individuels."
                    : "Une équipe compte au plus " + event.getMaxTeamSize() + " personnes.");
        }

        Submission submission = submissions.findByMember(eventId, owner.getId()).orElse(null);
        if (submission != null && !submission.getOwnerId().equals(owner.getId())) {
            throw new ConflictException("Tu fais déjà partie d’un projet pour cet événement : seule la personne qui l’a soumis peut le modifier.");
        }
        if (submission != null && !submission.isOpenToChanges()) {
            throw new BadRequestException("Ce projet est en revue : il ne peut plus être modifié.");
        }
        Set<Long> taken = submissions.findTaken(eventId, teammates.stream().map(Member::getId).toList(),
                submission != null ? submission.getId() : null);
        teammates.stream().filter(teammate -> taken.contains(teammate.getId())).findFirst().ifPresent(teammate -> {
            throw new ConflictException(fullName(teammate) + " fait déjà partie d’un autre projet pour cet événement.");
        });

        if (submission == null) submission = Submission.builder().eventId(eventId).ownerId(owner.getId()).build();
        submission.setTitle(draft.title().trim());
        submission.setRepositoryUrl(draft.repositoryUrl().trim());
        submission.setDemoUrl(draft.demoUrl() == null || draft.demoUrl().isBlank() ? null : draft.demoUrl().trim());
        submission.setDescription(draft.description().trim());
        submission.setUpdatedAt(Instant.now());
        Set<Long> team = new LinkedHashSet<>();
        team.add(owner.getId());
        teammates.forEach(teammate -> team.add(teammate.getId()));
        submission.setMemberIds(team);
        Submission saved = submissions.save(submission);

        // Everyone named on a project takes part in the event: their attestation will need it.
        registrations.ensureRegistered(eventId, team);
        log.info("Project {} submitted for event {} by member {} ({} people)", saved.getId(), eventId, owner.getId(), team.size());
        return views(List.of(saved), event).get(0);
    }

    private List<Member> teammates(List<String> emails, Member owner) {
        if (emails == null) return List.of();
        Set<String> distinct = emails.stream().filter(Objects::nonNull).map(value -> value.trim().toLowerCase(Locale.ROOT))
                .filter(value -> !value.isEmpty() && !value.equalsIgnoreCase(owner.getEmail()))
                .collect(Collectors.toCollection(LinkedHashSet::new));
        List<Member> found = new ArrayList<>();
        for (String address : distinct) {
            found.add(people.find(address).orElseThrow(() ->
                    new BadRequestException(address + " n’a pas encore de compte LesCracks : invite cette personne à s’inscrire, puis ajoute-la.")));
        }
        return found;
    }

    @Override
    public Optional<SubmissionView> findMine(Long eventId, String email) {
        return people.find(email).flatMap(member -> submissions.findByMember(eventId, member.getId()))
                .map(submission -> views(List.of(submission), requireEvent(eventId)).get(0));
    }

    @Override
    public List<SubmissionView> listForEvent(Long eventId) {
        Event event = requireEvent(eventId);
        return views(submissions.findByEvent(eventId), event);
    }

    @Override
    public SubmissionView review(Long submissionId, ProjectReview review) {
        Submission submission = submissions.findById(submissionId)
                .orElseThrow(() -> new NotFoundException("Projet", "id", submissionId));
        submission.review(review.status(), review.score(), review.rank(), review.note());
        Submission saved = submissions.save(submission);
        return views(List.of(saved), requireEvent(saved.getEventId())).get(0);
    }

    @Override
    public List<Submission> listOf(Long userId) {
        return submissions.findByUser(userId);
    }

    /** Every team of the list from one lookup of the members, owner first, then by name. */
    private List<SubmissionView> views(Collection<Submission> list, Event event) {
        Map<Long, Member> found = people.findAll(list.stream().flatMap(submission -> submission.getMemberIds().stream())
                .collect(Collectors.toSet()));
        return list.stream().map(submission -> {
            List<Member> team = new ArrayList<>();
            Member owner = found.get(submission.getOwnerId());
            if (owner != null) team.add(owner);
            submission.getMemberIds().stream().filter(id -> !id.equals(submission.getOwnerId())).map(found::get)
                    .filter(Objects::nonNull).sorted(Comparator.comparing(SubmissionServiceImpl::fullName, String.CASE_INSENSITIVE_ORDER))
                    .forEach(team::add);
            return new SubmissionView(submission, team, event.submissionsCloseAt());
        }).toList();
    }

    private Event requireEvent(Long eventId) {
        return events.findById(eventId).orElseThrow(() -> new NotFoundException("Event", "id", eventId));
    }

    private static String fullName(Member user) {
        String name = ((user.getFirstName() == null ? "" : user.getFirstName()) + " " + (user.getLastName() == null ? "" : user.getLastName())).trim();
        return name.isEmpty() ? user.getEmail() : name;
    }
}
