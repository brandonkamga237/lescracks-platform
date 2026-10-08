package com.brandonkamga.lescracks.cracklab.domain;

import com.brandonkamga.lescracks.cracklab.api.dto.AdminChallengeResponse;
import com.brandonkamga.lescracks.cracklab.api.dto.AuthorResponse;
import com.brandonkamga.lescracks.cracklab.api.dto.ChallengeDetailResponse;
import com.brandonkamga.lescracks.cracklab.api.dto.ChallengeSummaryResponse;
import com.brandonkamga.lescracks.cracklab.api.dto.CriterionResponse;
import com.brandonkamga.lescracks.cracklab.api.dto.EvaluationResponse;
import com.brandonkamga.lescracks.cracklab.api.dto.LevelResponse;
import com.brandonkamga.lescracks.cracklab.api.dto.ProgressResponse;
import com.brandonkamga.lescracks.cracklab.api.dto.PublicResultResponse;
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
    private final ProgressService progress;

    public CrackLabMapper(ChallengeService challenges, ProgressService progress) {
        this.challenges = challenges;
        this.progress = progress;
    }

    /** `mine` is the viewer's own answer to this challenge, so a card can say « résolu, 78/100 ». */
    public ChallengeSummaryResponse summary(Challenge challenge, Submission mine) {
        ChallengeStats stats = progress.statsFor(challenge.getId());
        return new ChallengeSummaryResponse(challenge.getId(), challenge.getSlug(), challenge.getTitle(), challenge.getCategory(),
                challenge.getDifficulty(), sortedTags(challenge), challenge.getExpectedFormat(), challenge.getMaxWords(),
                challenge.totalPoints(), stats.participants(), challenge.getPublishedAt(), stats.graded(), stats.averageScore(),
                stats.bestScore(), mine != null, mine == null ? null : mine.getTechnicalScore());
    }

    /** The reference solution is attached only when the viewer has already submitted. */
    public ChallengeDetailResponse detail(Challenge challenge, SubmissionResponse mySubmission) {
        return new ChallengeDetailResponse(challenge.getId(), challenge.getSlug(), challenge.getTitle(), challenge.getCategory(),
                challenge.getDifficulty(), sortedTags(challenge), challenge.getProblem(), challenge.getConstraints(),
                challenge.getExpectedFormat(), challenge.getMaxWords(), challenge.totalPoints(), criteria(challenge),
                challenges.submissionCount(challenge.getId()), challenge.getPublishedAt(),
                mySubmission == null ? null : challenge.getReferenceSolution(), mySubmission,
                stats(challenge).graded(), stats(challenge).averageScore(), stats(challenge).bestScore());
    }

    private ChallengeStats stats(Challenge challenge) {
        return progress.statsFor(challenge.getId());
    }

    public ProgressResponse progress(MemberProgress member, Long viewerId) {
        Level next = member.level().next();
        List<ProgressResponse.BadgeResponse> badges = member.badges().stream()
                .map(state -> new ProgressResponse.BadgeResponse(state.badge().name(), state.badge().label(), state.badge().description(), state.unlocked()))
                .toList();
        List<ProgressResponse.HistoryItem> history = member.history().stream()
                .map(s -> new ProgressResponse.HistoryItem(s.getId(), s.getChallenge().getSlug(), s.getChallenge().getTitle(),
                        s.getChallenge().getCategory(), s.getChallenge().getDifficulty(), s.getStatus(), s.getTechnicalScore(),
                        s.getChallenge().totalPoints(), s.getCreatedAt()))
                .toList();
        return new ProgressResponse(author(member.member()), member.xp(), level(member.level()), next == null ? null : level(next),
                member.rank(), member.rankedMembers(), member.betterThanPercent(), member.pointsToNextRank(), member.weekScore(),
                member.answered(), member.graded(), member.averagePercent(), member.bestPercent(), member.streak(),
                member.activeThisWeek(), member.bestStreak(), badges, history,
                viewerId != null && viewerId.equals(member.member().getId()));
    }

    public PublicResultResponse publicResult(PublicResult result) {
        Submission submission = result.submission();
        return new PublicResultResponse(submission.getId(), summary(submission.getChallenge(), null), author(submission.getUser()),
                level(result.authorLevel()), submission.getStatus(), submission.getTechnicalScore(),
                submission.getChallenge().totalPoints(), result.rankOnChallenge(), result.betterThanPercent(), submission.getGradedAt());
    }

    public static LevelResponse level(Level level) {
        return new LevelResponse(level.number(), level.name(), level.minXp());
    }

    public AdminChallengeResponse admin(Challenge challenge) {
        Long id = challenge.getId();
        return new AdminChallengeResponse(id, challenge.getSlug(), challenge.getTitle(), challenge.getCategory(),
                challenge.getDifficulty(), sortedTags(challenge), challenge.getProblem(), challenge.getConstraints(),
                challenge.getExpectedFormat(), challenge.getMaxWords(), challenge.getReferenceSolution(), criteria(challenge),
                challenge.totalPoints(), challenge.getStatus(), challenge.getCreatedBy(), challenges.submissionCount(id),
                challenges.pendingCount(id), challenges.gradingLocked(id), challenge.getPublishedAt(),
                challenge.getCreatedAt(), challenge.getUpdatedAt(), challenge.getScheduledAt());
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

    /** `xp` is the member's all-time total, so the weekly board still shows their real level. */
    public RankingEntryResponse ranking(int rank, SubmissionRepository.RankingRow row, Long viewerId, long xp) {
        return new RankingEntryResponse(rank,
                new AuthorResponse(row.getUserId(), displayName(row.getFirstName(), row.getLastName(), row.getUsername()), avatar(row.getAvatarUrl())),
                row.getTotalScore() == null ? 0 : row.getTotalScore(), row.getChallenges(),
                viewerId != null && viewerId.equals(row.getUserId()), level(Level.of(xp)));
    }

    public AuthorResponse author(User user) {
        return new AuthorResponse(user.getId(), displayName(user.getFirstName(), user.getLastName(), user.getUsername()), avatar(user.getAvatarUrl()));
    }

    public static String displayNameOf(User user) {
        return displayName(user.getFirstName(), user.getLastName(), user.getUsername());
    }

    /** "Awa N." — enough to recognise someone on a leaderboard, never the email. */
    public static String displayName(String firstName, String lastName, String username) {
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
