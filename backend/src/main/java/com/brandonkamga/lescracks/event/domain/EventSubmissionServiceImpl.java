package com.brandonkamga.lescracks.event.domain;

import com.brandonkamga.lescracks.event.infra.EventSubmissionRepository;
import com.brandonkamga.lescracks.member.application.Member;
import com.brandonkamga.lescracks.member.application.MemberDirectory;
import com.brandonkamga.lescracks.shared.exception.BadRequestException;
import com.brandonkamga.lescracks.shared.exception.ConflictException;
import com.brandonkamga.lescracks.shared.exception.NotFoundException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@Transactional
public class EventSubmissionServiceImpl implements EventSubmissionService {
    private static final Logger log = LoggerFactory.getLogger(EventSubmissionServiceImpl.class);

    private final EventSubmissionRepository submissions;
    private final EventService events;
    private final EventRegistrationService registrations;
    private final MemberDirectory people;

    public EventSubmissionServiceImpl(EventSubmissionRepository submissions, EventService events,
                                      EventRegistrationService registrations, MemberDirectory people) {
        this.submissions = submissions;
        this.events = events;
        this.registrations = registrations;
        this.people = people;
    }

    @Override
    public SubmissionView submit(Long eventId, String email, ProjectDraft draft) {
        Event event = events.require(eventId);
        if (event.getStatus() != EventStatus.PUBLISHED || !event.isAcceptsSubmissions()) {
            throw new BadRequestException("Cet événement ne reçoit pas de projets.");
        }
        Instant closesAt = event.submissionsCloseAt();
        if (closesAt != null && closesAt.isBefore(Instant.now())) throw new BadRequestException("Les soumissions sont closes.");

        Member owner = people.require(email);
        List<Member> teammates = teammates(draft.teammateEmails(), owner);
        if (1 + teammates.size() > event.getMaxTeamSize()) {
            throw new BadRequestException(event.getMaxTeamSize() == 1
                    ? "Les projets de cet événement sont individuels."
                    : "Une équipe compte au plus " + event.getMaxTeamSize() + " personnes.");
        }

        EventSubmission submission = submissions.findByEventAndMember(eventId, owner.getId()).orElse(null);
        if (submission != null && !submission.getOwnerId().equals(owner.getId())) {
            throw new ConflictException("Tu fais déjà partie d’un projet pour cet événement : seule la personne qui l’a soumis peut le modifier.");
        }
        if (submission != null && submission.getStatus() != SubmissionStatus.SUBMITTED) {
            throw new BadRequestException("Ce projet est en revue : il ne peut plus être modifié.");
        }
        Long current = submission != null ? submission.getId() : null;
        for (Member teammate : teammates) {
            submissions.findByEventAndMember(eventId, teammate.getId())
                    .filter(other -> !Objects.equals(other.getId(), current))
                    .ifPresent(other -> { throw new ConflictException(fullName(teammate) + " fait déjà partie d’un autre projet pour cet événement."); });
        }

        if (submission == null) submission = EventSubmission.builder().event(event).ownerId(owner.getId()).build();
        submission.setTitle(draft.title().trim());
        submission.setRepositoryUrl(draft.repositoryUrl().trim());
        submission.setDemoUrl(draft.demoUrl() == null || draft.demoUrl().isBlank() ? null : draft.demoUrl().trim());
        submission.setDescription(draft.description().trim());
        submission.setUpdatedAt(Instant.now());
        Set<TeamMember> members = new LinkedHashSet<>();
        members.add(new TeamMember(owner.getId(), eventId));
        teammates.forEach(teammate -> members.add(new TeamMember(teammate.getId(), eventId)));
        submission.getMembers().clear();
        submission.getMembers().addAll(members);
        EventSubmission saved = submissions.save(submission);

        // Everyone named on a project takes part in the event: their attestation will need it.
        registrations.ensureRegistered(event, owner.getId());
        teammates.forEach(teammate -> registrations.ensureRegistered(event, teammate.getId()));
        log.info("Project {} submitted for event {} by member {} ({} people)", saved.getId(), eventId, owner.getId(), members.size());
        return view(saved);
    }

    private List<Member> teammates(List<String> emails, Member owner) {
        if (emails == null) return List.of();
        Set<String> distinct = emails.stream().filter(Objects::nonNull).map(value -> value.trim().toLowerCase(Locale.ROOT))
                .filter(value -> !value.isEmpty() && !value.equalsIgnoreCase(owner.getEmail()))
                .collect(Collectors.toCollection(LinkedHashSet::new));
        List<Member> found = new ArrayList<>();
        for (String address : distinct) {
            found.add(people.find(address).filter(Member::hasLoginMethod).orElseThrow(() ->
                    new BadRequestException(address + " n’a pas encore de compte LesCracks : invite cette personne à s’inscrire, puis ajoute-la.")));
        }
        return found;
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<SubmissionView> mine(Long eventId, String email) {
        return people.find(email).flatMap(member -> submissions.findByEventAndMember(eventId, member.getId())).map(this::view);
    }

    @Override
    @Transactional(readOnly = true)
    public List<SubmissionView> forEvent(Long eventId) {
        events.require(eventId);
        return submissions.findForEvent(eventId).stream().map(this::view).toList();
    }

    @Override
    public SubmissionView review(Long submissionId, ProjectReview review) {
        EventSubmission submission = submissions.findById(submissionId)
                .orElseThrow(() -> new NotFoundException("Projet", "id", submissionId));
        if (review.status() != null) submission.setStatus(review.status());
        if (review.score() != null && (review.score() < 0 || review.score() > 100)) throw new BadRequestException("La note va de 0 à 100.");
        if (review.rank() != null && (review.rank() < 1 || review.rank() > 10)) throw new BadRequestException("Le classement va de 1 à 10.");
        submission.setScore(review.score());
        submission.setRank(review.rank());
        submission.setReviewNote(review.note() == null || review.note().isBlank() ? null : review.note().trim());
        submission.setUpdatedAt(Instant.now());
        return view(submission);
    }

    private SubmissionView view(EventSubmission submission) {
        Map<Long, Member> found = people.findAll(submission.getMembers().stream().map(TeamMember::userId).toList());
        List<Member> team = new ArrayList<>();
        if (found.containsKey(submission.getOwnerId())) team.add(found.get(submission.getOwnerId()));
        found.values().stream().filter(user -> !user.getId().equals(submission.getOwnerId()))
                .sorted((a, b) -> fullName(a).compareToIgnoreCase(fullName(b))).forEach(team::add);
        return new SubmissionView(submission, team, submission.getEvent().submissionsCloseAt());
    }

    private static String fullName(Member user) {
        String name = ((user.getFirstName() == null ? "" : user.getFirstName()) + " " + (user.getLastName() == null ? "" : user.getLastName())).trim();
        return name.isEmpty() ? user.getEmail() : name;
    }
}
