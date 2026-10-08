package com.brandonkamga.lescracks.cracklab.domain;

import com.brandonkamga.lescracks.cracklab.api.dto.AdminChallengeResponse;
import com.brandonkamga.lescracks.cracklab.api.dto.AuthorResponse;
import com.brandonkamga.lescracks.cracklab.api.dto.ChallengeDetailResponse;
import com.brandonkamga.lescracks.cracklab.api.dto.ChallengeSummaryResponse;
import com.brandonkamga.lescracks.cracklab.api.dto.CriterionResponse;
import com.brandonkamga.lescracks.cracklab.api.dto.EvaluationResponse;
import com.brandonkamga.lescracks.cracklab.api.dto.RankingEntryResponse;
import com.brandonkamga.lescracks.cracklab.api.dto.SubmissionResponse;
import com.brandonkamga.lescracks.cracklab.infra.SubmissionRepository;
import com.brandonkamga.lescracks.identity.domain.User;

import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

/** Entities to API payloads. The reference solution only ever leaves through the two methods that say so. */
@Component
public class CrackLabMapper {

    private final ChallengeService challenges;

    public CrackLabMapper(ChallengeService challenges) {
        this.challenges = challenges;
    }

    public ChallengeSummaryResponse summary(Challenge challenge) {
        return new ChallengeSummaryResponse(challenge.getId(), challenge.getSlug(), challenge.getTitle(), challenge.getCategory(),
                challenge.getDifficulty(), sortedTags(challenge), challenge.getExpectedFormat(), challenge.getMaxWords(),
                challenge.totalPoints(), challenges.submissionCount(challenge.getId()), challenge.getPublishedAt());
    }

    /** The reference solution is attached only when the viewer has already submitted. */
    public ChallengeDetailResponse detail(Challenge challenge, SubmissionResponse mySubmission) {
        return new ChallengeDetailResponse(challenge.getId(), challenge.getSlug(), challenge.getTitle(), challenge.getCategory(),
                challenge.getDifficulty(), sortedTags(challenge), challenge.getProblem(), challenge.getConstraints(),
                challenge.getExpectedFormat(), challenge.getMaxWords(), challenge.totalPoints(), criteria(challenge),
                challenges.submissionCount(challenge.getId()), challenge.getPublishedAt(),
                mySubmission == null ? null : challenge.getReferenceSolution(), mySubmission);
    }

    public AdminChallengeResponse admin(Challenge challenge) {
        Long id = challenge.getId();
        return new AdminChallengeResponse(id, challenge.getSlug(), challenge.getTitle(), challenge.getCategory(),
                challenge.getDifficulty(), sortedTags(challenge), challenge.getProblem(), challenge.getConstraints(),
                challenge.getExpectedFormat(), challenge.getMaxWords(), challenge.getReferenceSolution(), criteria(challenge),
                challenge.totalPoints(), challenge.getStatus(), challenge.getCreatedBy(), challenges.submissionCount(id),
                challenges.pendingCount(id), challenges.gradingLocked(id), challenge.getPublishedAt(),
                challenge.getCreatedAt(), challenge.getUpdatedAt());
    }

    public SubmissionResponse submission(Submission submission, Long viewerId, int myVote) {
        Challenge challenge = submission.getChallenge();
        Map<Long, SubmissionEvaluation> grades = submission.getEvaluations().stream()
                .collect(Collectors.toMap(evaluation -> evaluation.getCriterion().getId(), Function.identity()));
        List<EvaluationResponse> evaluations = submission.getStatus() != SubmissionStatus.GRADED ? List.of()
                : challenge.getCriteria().stream()
                        .filter(criterion -> grades.containsKey(criterion.getId()))
                        .map(criterion -> new EvaluationResponse(criterion.getId(), criterion.getLabel(), criterion.getMaxPoints(),
                                grades.get(criterion.getId()).getPoints(), grades.get(criterion.getId()).getFeedback()))
                        .toList();
        return new SubmissionResponse(submission.getId(), challenge.getId(), challenge.getSlug(), challenge.getTitle(),
                author(submission.getUser()), submission.getAnswer(), WordCount.of(submission.getAnswer()),
                submission.getTechnicalScore(), challenge.totalPoints(), submission.getVoteScore(), myVote,
                viewerId != null && viewerId.equals(submission.getUser().getId()), submission.getStatus(),
                submission.getCreatedAt(), submission.getGradedAt(), evaluations);
    }

    public RankingEntryResponse ranking(int rank, SubmissionRepository.RankingRow row, Long viewerId) {
        return new RankingEntryResponse(rank,
                new AuthorResponse(displayName(row.getFirstName(), row.getLastName(), row.getUsername()), avatar(row.getAvatarUrl())),
                row.getTotalScore() == null ? 0 : row.getTotalScore(), row.getChallenges(),
                viewerId != null && viewerId.equals(row.getUserId()));
    }

    public AuthorResponse author(User user) {
        return new AuthorResponse(displayName(user.getFirstName(), user.getLastName(), user.getUsername()), avatar(user.getAvatarUrl()));
    }

    /** "Awa N." — enough to recognise someone on a leaderboard, never the email. */
    static String displayName(String firstName, String lastName, String username) {
        String first = firstName == null ? "" : firstName.trim();
        String last = lastName == null ? "" : lastName.trim();
        if (!first.isEmpty()) {
            return last.isEmpty() ? first : first + " " + last.substring(0, 1).toUpperCase() + ".";
        }
        if (username != null && !username.isBlank()) {
            return username.trim();
        }
        return "Membre LesCracks";
    }

    private static String avatar(String key) {
        if (key == null || key.isBlank()) {
            return null;
        }
        return key.startsWith("http") || key.startsWith("/") ? key : "/api/files/" + key;
    }

    private static List<CriterionResponse> criteria(Challenge challenge) {
        return challenge.getCriteria().stream()
                .map(criterion -> new CriterionResponse(criterion.getId(), criterion.getLabel(), criterion.getMaxPoints()))
                .toList();
    }

    private static List<String> sortedTags(Challenge challenge) {
        return challenge.getTags().stream().sorted(String.CASE_INSENSITIVE_ORDER).toList();
    }
}
