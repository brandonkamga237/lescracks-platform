package com.brandonkamga.lescracks.cracklab.domain;

import com.brandonkamga.lescracks.cracklab.infra.SubmissionRepository;
import com.brandonkamga.lescracks.identity.domain.User;
import com.brandonkamga.lescracks.shared.exception.NotFoundException;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Instant;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class ProgressServiceImpl implements ProgressService {

    private final SubmissionRepository submissions;
    private final Clock clock;

    @Autowired
    public ProgressServiceImpl(SubmissionRepository submissions) {
        this(submissions, Clock.systemUTC());
    }

    /** A fixed clock makes streaks and the weekly reset testable. */
    ProgressServiceImpl(SubmissionRepository submissions, Clock clock) {
        this.submissions = submissions;
        this.clock = clock;
    }

    @Override
    public MemberProgress of(User member) {
        List<Submission> history = submissions.findByUserIdOrderByCreatedAtDesc(member.getId());
        Map<Long, Long> totals = submissions.totalsByMember().stream()
                .collect(Collectors.toMap(SubmissionRepository.MemberTotal::getUserId, SubmissionRepository.MemberTotal::getTotal));
        Instant now = clock.instant();

        List<Submission> graded = history.stream().filter(s -> s.getStatus() == SubmissionStatus.GRADED).toList();
        long xp = totals.getOrDefault(member.getId(), 0L);
        boolean ranked = totals.containsKey(member.getId());
        int rank = ranked ? 1 + (int) totals.values().stream().filter(total -> total > xp).count() : 0;
        long lower = totals.values().stream().filter(total -> total < xp).count();
        int betterThan = ranked && totals.size() > 1 ? (int) (lower * 100 / (totals.size() - 1)) : 0;
        long above = totals.values().stream().filter(total -> total > xp).mapToLong(Long::longValue).min().orElse(xp);
        long toNextRank = ranked && above > xp ? above - xp + 1 : 0;

        List<Integer> percents = graded.stream().map(ProgressServiceImpl::percent).toList();
        List<Instant> answeredAt = history.stream().map(Submission::getCreatedAt).toList();
        int bestStreak = Streaks.best(answeredAt);

        MemberProgressInputs inputs = new MemberProgressInputs(history, graded, rank, bestStreak, submissions.votesReceived(member.getId()));
        return new MemberProgress(
                member, xp, Level.of(xp), rank, totals.size(), betterThan, toNextRank,
                submissions.scoreSince(member.getId(), Streaks.weekStart(now)),
                history.size(), graded.size(),
                (int) Math.round(percents.stream().mapToInt(Integer::intValue).average().orElse(0)),
                percents.stream().mapToInt(Integer::intValue).max().orElse(0),
                Streaks.current(answeredAt, now), Streaks.activeThisWeek(answeredAt, now), bestStreak,
                badges(inputs), history);
    }

    @Override
    public MemberProgress publicProfile(Long memberId) {
        List<Submission> history = submissions.findByUserIdOrderByCreatedAtDesc(memberId);
        if (history.isEmpty()) {
            throw new NotFoundException("Membre", "id", memberId);
        }
        return of(history.get(0).getUser());
    }

    @Override
    public ChallengeStats statsFor(Long challengeId) {
        SubmissionRepository.ChallengeStats stats = submissions.challengeStats(challengeId);
        long graded = stats == null || stats.getGraded() == null ? 0 : stats.getGraded();
        return new ChallengeStats(submissions.countByChallengeId(challengeId), graded,
                graded == 0 || stats.getAverage() == null ? null : (int) Math.round(stats.getAverage()),
                graded == 0 ? null : stats.getBest());
    }

    @Override
    public PublicResult result(Long submissionId) {
        Submission submission = submissions.findById(submissionId)
                .orElseThrow(() -> new NotFoundException("Réponse", "id", submissionId));
        Long challengeId = submission.getChallenge().getId();
        ChallengeStats stats = statsFor(challengeId);
        long xp = submissions.totalsByMember().stream()
                .filter(total -> total.getUserId().equals(submission.getUser().getId()))
                .mapToLong(SubmissionRepository.MemberTotal::getTotal).findFirst().orElse(0L);
        int rankOnChallenge = 0;
        int betterThan = 0;
        if (submission.getStatus() == SubmissionStatus.GRADED) {
            int score = submission.getTechnicalScore();
            rankOnChallenge = 1 + (int) submissions.countByChallengeIdAndStatusAndTechnicalScoreGreaterThan(challengeId, SubmissionStatus.GRADED, score);
            long lower = submissions.countByChallengeIdAndStatusAndTechnicalScoreLessThan(challengeId, SubmissionStatus.GRADED, score);
            betterThan = stats.graded() > 1 ? (int) (lower * 100 / (stats.graded() - 1)) : 0;
        }
        return new PublicResult(submission, Level.of(xp), rankOnChallenge, betterThan, stats);
    }

    @Override
    public Page<SubmissionRepository.RankingRow> weekRanking(Pageable pageable) {
        return submissions.rankingSince(weekStart(), pageable);
    }

    @Override
    public Map<Long, Long> allTimeXp() {
        return submissions.totalsByMember().stream()
                .collect(Collectors.toMap(SubmissionRepository.MemberTotal::getUserId, SubmissionRepository.MemberTotal::getTotal));
    }

    @Override
    public Instant weekStart() {
        return Streaks.weekStart(clock.instant());
    }

    record MemberProgressInputs(List<Submission> history, List<Submission> graded, int rank, int bestStreak, long votesReceived) {
    }

    /** Every badge, unlocked or not: a locked one shown with its condition is the next goal. */
    static List<MemberProgress.BadgeState> badges(MemberProgressInputs inputs) {
        long categories = inputs.history().stream().map(s -> s.getChallenge().getCategory().toLowerCase()).distinct().count();
        return Arrays.stream(Badge.values()).map(badge -> new MemberProgress.BadgeState(badge, switch (badge) {
            case FIRST_STEP -> !inputs.history().isEmpty();
            case FLAWLESS -> inputs.graded().stream().anyMatch(s -> percent(s) >= 90);
            case HARDCORE -> inputs.graded().stream().anyMatch(s -> s.getChallenge().getDifficulty() == ChallengeDifficulty.ADVANCED && percent(s) >= 70);
            case VERSATILE -> categories >= 3;
            case REGULAR -> inputs.bestStreak() >= 4;
            case APPRECIATED -> inputs.votesReceived() >= 10;
            case PODIUM -> inputs.rank() >= 1 && inputs.rank() <= 3;
        })).toList();
    }

    static int percent(Submission submission) {
        int total = submission.getChallenge().totalPoints();
        return total == 0 || submission.getTechnicalScore() == null ? 0 : Math.round(submission.getTechnicalScore() * 100f / total);
    }
}
