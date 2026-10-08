package com.brandonkamga.lescracks.cracklab.domain;

import com.brandonkamga.lescracks.cracklab.infra.SubmissionRepository;
import com.brandonkamga.lescracks.identity.domain.User;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;

import static com.brandonkamga.lescracks.cracklab.domain.CrackLabFixtures.challenge;
import static com.brandonkamga.lescracks.cracklab.domain.CrackLabFixtures.member;
import static com.brandonkamga.lescracks.cracklab.domain.CrackLabFixtures.submission;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProgressServiceTest {

    @Mock private SubmissionRepository submissions;

    private ProgressServiceImpl service;
    private User awa;

    private static final Instant NOW = Instant.parse("2026-10-07T12:00:00Z");

    @BeforeEach
    void setUp() {
        service = new ProgressServiceImpl(submissions, Clock.fixed(NOW, ZoneOffset.UTC));
        awa = member(1, "awa@example.com");
    }

    private static SubmissionRepository.MemberTotal total(long userId, long total) {
        return new SubmissionRepository.MemberTotal() {
            public Long getUserId() { return userId; }
            public Long getTotal() { return total; }
        };
    }

    private Submission graded(long id, Challenge challenge, int score, String createdAt) {
        Submission submission = submission(id, challenge, awa);
        submission.setStatus(SubmissionStatus.GRADED);
        submission.setTechnicalScore(score);
        submission.setCreatedAt(Instant.parse(createdAt));
        return submission;
    }

    @Test
    @DisplayName("rank, percentile and the gap to the member above come from everyone's totals")
    void standingAmongMembers() {
        when(submissions.findByUserIdOrderByCreatedAtDesc(1L)).thenReturn(List.of(graded(10, challenge(1, null), 78, "2026-10-06T09:00:00Z")));
        when(submissions.totalsByMember()).thenReturn(List.of(total(1, 178), total(2, 245), total(3, 150), total(4, 91)));
        when(submissions.scoreSince(anyLong(), any())).thenReturn(78L);

        MemberProgress progress = service.of(awa);

        assertThat(progress.xp()).isEqualTo(178);
        assertThat(progress.level().name()).isEqualTo("Apprenti");
        assertThat(progress.rank()).isEqualTo(2);
        assertThat(progress.betterThanPercent()).isEqualTo(66);
        assertThat(progress.pointsToNextRank()).isEqualTo(68);
        assertThat(progress.weekScore()).isEqualTo(78);
        assertThat(progress.streak()).isEqualTo(1);
        assertThat(progress.activeThisWeek()).isTrue();
    }

    @Test
    @DisplayName("a member with no graded answer is not ranked yet")
    void unrankedBeforeFirstGrade() {
        Submission pending = submission(10, challenge(1, null), awa);
        pending.setCreatedAt(NOW);
        when(submissions.findByUserIdOrderByCreatedAtDesc(1L)).thenReturn(List.of(pending));
        when(submissions.totalsByMember()).thenReturn(List.of(total(2, 245)));

        MemberProgress progress = service.of(awa);

        assertThat(progress.rank()).isZero();
        assertThat(progress.pointsToNextRank()).isZero();
        assertThat(progress.badges()).filteredOn(MemberProgress.BadgeState::unlocked)
                .extracting(MemberProgress.BadgeState::badge).containsExactly(Badge.FIRST_STEP);
    }

    @Test
    @DisplayName("badges unlock from the record: 90 %+, 70 %+ on an advanced challenge, podium")
    void badgesUnlockFromTheRecord() {
        Challenge advanced = challenge(2, null);
        advanced.setDifficulty(ChallengeDifficulty.ADVANCED);
        List<Submission> graded = List.of(graded(10, challenge(1, null), 92, "2026-10-06T09:00:00Z"), graded(11, advanced, 71, "2026-09-29T09:00:00Z"));

        List<MemberProgress.BadgeState> badges = ProgressServiceImpl.badges(new ProgressServiceImpl.MemberProgressInputs(graded, graded, 2, 2, 3));

        assertThat(badges).filteredOn(MemberProgress.BadgeState::unlocked).extracting(MemberProgress.BadgeState::badge)
                .containsExactlyInAnyOrder(Badge.FIRST_STEP, Badge.FLAWLESS, Badge.HARDCORE, Badge.PODIUM);
    }
}
