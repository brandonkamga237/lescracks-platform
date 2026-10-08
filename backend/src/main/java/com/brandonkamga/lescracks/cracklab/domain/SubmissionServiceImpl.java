package com.brandonkamga.lescracks.cracklab.domain;

import com.brandonkamga.lescracks.cracklab.api.dto.GradeRequest;
import com.brandonkamga.lescracks.cracklab.infra.SubmissionRepository;
import com.brandonkamga.lescracks.cracklab.infra.SubmissionVoteRepository;
import com.brandonkamga.lescracks.identity.domain.User;
import com.brandonkamga.lescracks.identity.domain.UserProfileService;
import com.brandonkamga.lescracks.shared.exception.BadRequestException;
import com.brandonkamga.lescracks.shared.exception.ConflictException;
import com.brandonkamga.lescracks.shared.exception.ForbiddenException;
import com.brandonkamga.lescracks.shared.exception.NotFoundException;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Collection;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@Transactional
public class SubmissionServiceImpl implements SubmissionService {

    private final SubmissionRepository submissions;
    private final SubmissionVoteRepository votes;
    private final ChallengeService challenges;
    private final UserProfileService profiles;

    public SubmissionServiceImpl(SubmissionRepository submissions, SubmissionVoteRepository votes,
                                 ChallengeService challenges, UserProfileService profiles) {
        this.submissions = submissions;
        this.votes = votes;
        this.challenges = challenges;
        this.profiles = profiles;
    }

    @Override
    public Submission submit(String challengeSlug, String email, String answer) {
        Challenge challenge = challenges.requirePublished(challengeSlug);
        User member = member(email);
        if (submissions.existsByChallengeIdAndUserId(challenge.getId(), member.getId())) {
            throw new ConflictException("Tu as déjà répondu à ce challenge : une réponse soumise est définitive.");
        }
        String text = answer == null ? "" : answer.trim();
        if (text.isEmpty()) {
            throw new BadRequestException("Ta réponse est vide.");
        }
        int words = WordCount.of(text);
        if (challenge.getMaxWords() != null && words > challenge.getMaxWords()) {
            throw new BadRequestException("Ta réponse fait " + words + " mots ; la limite est de " + challenge.getMaxWords() + ".");
        }
        Submission submission = new Submission();
        submission.setChallenge(challenge);
        submission.setUser(member);
        submission.setAnswer(text);
        return submissions.save(submission);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<Submission> mine(Long challengeId, String email) {
        return memberOrEmpty(email).flatMap(member -> submissions.findByChallengeIdAndUserId(challengeId, member.getId()));
    }

    @Override
    @Transactional(readOnly = true)
    public List<Submission> forChallenge(String challengeSlug, String email) {
        Challenge challenge = challenges.requirePublished(challengeSlug);
        User member = member(email);
        // Seeing other answers before writing one would make the challenge pointless.
        if (!submissions.existsByChallengeIdAndUserId(challenge.getId(), member.getId())) {
            throw new ForbiddenException("Réponds d'abord au challenge pour découvrir les autres réponses.");
        }
        return submissions.findForChallenge(challenge.getId());
    }

    @Override
    @Transactional(readOnly = true)
    public List<Submission> mineAll(String email) {
        return submissions.findByUserIdOrderByCreatedAtDesc(member(email).getId());
    }

    /**
     * Every criterion of the rubric gets a grade between 0 and its maximum, exactly once; the
     * technical score is their sum. Grading again replaces the previous grades in place.
     */
    @Override
    public Submission grade(Long submissionId, GradeRequest request, String adminUsername) {
        Submission submission = require(submissionId);
        List<ChallengeCriterion> rubric = submission.getChallenge().getCriteria();
        Map<Long, ChallengeCriterion> byId = rubric.stream()
                .collect(Collectors.toMap(ChallengeCriterion::getId, Function.identity()));

        Set<Long> seen = new HashSet<>();
        for (GradeRequest.CriterionGrade grade : request.criteria()) {
            ChallengeCriterion criterion = byId.get(grade.criterionId());
            if (criterion == null) {
                throw new BadRequestException("Ce critère n'appartient pas à la grille du challenge.");
            }
            if (!seen.add(grade.criterionId())) {
                throw new BadRequestException("Le critère « " + criterion.getLabel() + " » est noté deux fois.");
            }
            if (grade.points() < 0 || grade.points() > criterion.getMaxPoints()) {
                throw new BadRequestException("« " + criterion.getLabel() + " » se note entre 0 et " + criterion.getMaxPoints() + ".");
            }
        }
        if (seen.size() != rubric.size()) {
            throw new BadRequestException("Chaque critère de la grille doit recevoir une note.");
        }

        // Updated in place: deleting then re-inserting the same (submission, criterion) pair in one
        // flush would trip the unique constraint, since Hibernate inserts before it deletes.
        Map<Long, SubmissionEvaluation> existing = submission.getEvaluations().stream()
                .collect(Collectors.toMap(evaluation -> evaluation.getCriterion().getId(), Function.identity()));
        int total = 0;
        for (GradeRequest.CriterionGrade grade : request.criteria()) {
            SubmissionEvaluation evaluation = existing.get(grade.criterionId());
            if (evaluation == null) {
                evaluation = new SubmissionEvaluation();
                evaluation.setSubmission(submission);
                evaluation.setCriterion(byId.get(grade.criterionId()));
                submission.getEvaluations().add(evaluation);
            }
            evaluation.setPoints(grade.points());
            evaluation.setFeedback(grade.feedback() == null || grade.feedback().isBlank() ? null : grade.feedback().trim());
            total += grade.points();
        }

        submission.setTechnicalScore(total);
        submission.setStatus(SubmissionStatus.GRADED);
        submission.setGradedBy(adminUsername);
        submission.setGradedAt(Instant.now());
        return submission;
    }

    /**
     * One vote per member and submission: voting again changes it, 0 withdraws it. The total is
     * recomputed from the votes table rather than incremented, so it can never drift, and the
     * technical score is never touched.
     */
    @Override
    public VoteResult vote(Long submissionId, String email, int value) {
        if (value < -1 || value > 1) {
            throw new BadRequestException("Un vote vaut +1, -1, ou 0 pour le retirer.");
        }
        Submission submission = require(submissionId);
        User voter = member(email);
        if (submission.getUser().getId().equals(voter.getId())) {
            throw new ForbiddenException("Tu ne peux pas voter pour ta propre réponse.");
        }
        if (!submissions.existsByChallengeIdAndUserId(submission.getChallenge().getId(), voter.getId())) {
            throw new ForbiddenException("Réponds d'abord au challenge pour voter.");
        }

        Optional<SubmissionVote> current = votes.findBySubmissionIdAndUserId(submissionId, voter.getId());
        if (value == 0) {
            current.ifPresent(votes::delete);
        } else if (current.isPresent()) {
            current.get().setValue((short) value);
        } else {
            SubmissionVote vote = new SubmissionVote();
            vote.setSubmission(submission);
            vote.setUser(voter);
            vote.setValue((short) value);
            votes.save(vote);
        }
        votes.flush();

        int total = Math.toIntExact(votes.sumValues(submissionId));
        submission.setVoteScore(total);
        return new VoteResult(total, value);
    }

    @Override
    @Transactional(readOnly = true)
    public Map<Long, Integer> myVotes(Collection<Long> submissionIds, String email) {
        Optional<User> member = memberOrEmpty(email);
        if (member.isEmpty() || submissionIds.isEmpty()) {
            return Map.of();
        }
        Map<Long, Integer> mine = new HashMap<>();
        votes.findBySubmissionIdInAndUserId(submissionIds, member.get().getId())
                .forEach(vote -> mine.put(vote.getSubmission().getId(), (int) vote.getValue()));
        return mine;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<SubmissionRepository.RankingRow> ranking(Pageable pageable) {
        return submissions.ranking(pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<Long> memberId(String email) {
        return memberOrEmpty(email).map(User::getId);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<Submission> forAdmin(SubmissionStatus status, Long challengeId, Pageable pageable) {
        return submissions.searchForAdmin(status, challengeId, pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public Submission require(Long id) {
        return submissions.findById(id).orElseThrow(() -> new NotFoundException("Réponse", "id", id));
    }

    @Override
    @Transactional(readOnly = true)
    public User requireMember(String email) {
        return member(email);
    }

    /** Admin accounts live in their own table: they manage CrackLab but do not play it. */
    private User member(String email) {
        if (email == null || email.isBlank()) {
            throw new ForbiddenException("Connecte-toi avec ton compte membre pour participer.");
        }
        return memberOrEmpty(email).orElseThrow(() ->
                new ForbiddenException("Les challenges se jouent avec un compte membre, pas avec un compte administrateur."));
    }

    private Optional<User> memberOrEmpty(String email) {
        if (email == null || email.isBlank()) {
            return Optional.empty();
        }
        return profiles.find(email);
    }
}
