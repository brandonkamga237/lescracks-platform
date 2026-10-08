package com.brandonkamga.lescracks.cracklab.domain;

import com.brandonkamga.lescracks.cracklab.api.dto.ChallengeRequest;
import com.brandonkamga.lescracks.cracklab.api.dto.ChallengeRequest.CriterionRequest;
import com.brandonkamga.lescracks.cracklab.infra.ChallengeRepository;
import com.brandonkamga.lescracks.cracklab.infra.SubmissionRepository;
import com.brandonkamga.lescracks.shared.exception.ConflictException;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;

import static com.brandonkamga.lescracks.cracklab.domain.CrackLabFixtures.challenge;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ChallengeServiceTest {

    @Mock private ChallengeRepository challenges;
    @Mock private SubmissionRepository submissions;

    private ChallengeServiceImpl service;
    private Challenge existing;

    @BeforeEach
    void setUp() {
        service = new ChallengeServiceImpl(challenges, submissions);
        existing = challenge(10, 500);
    }

    private static ChallengeRequest request(List<CriterionRequest> criteria) {
        return request(criteria, null);
    }

    private static ChallengeRequest request(List<CriterionRequest> criteria, Instant scheduledAt) {
        return new ChallengeRequest("Concevoir un cache distribué", "Backend", ChallengeDifficulty.INTERMEDIATE,
                List.of("Redis", " Performance ", ""), "Une API répond en 2 s.", null, "500 mots maximum", 500,
                "Cache Redis.", criteria, ChallengeStatus.PUBLISHED, scheduledAt);
    }

    private static List<CriterionRequest> sameRubricRelabelled() {
        return List.of(
                new CriterionRequest(1L, "Diagnostic", 20),
                new CriterionRequest(2L, "Solution", 30),
                new CriterionRequest(3L, "Justification", 20),
                new CriterionRequest(4L, "Scalabilité", 15),
                new CriterionRequest(5L, "Compromis", 15));
    }

    @Test
    @DisplayName("creating a challenge numbers its criteria, cleans its tags and dates its publication")
    void createBuildsRubricAndPublishes() {
        when(challenges.existsBySlug("concevoir-un-cache-distribue")).thenReturn(false);
        when(challenges.save(any())).thenAnswer(call -> call.getArgument(0));

        Challenge created = service.create(request(List.of(new CriterionRequest(null, "Solution", 60), new CriterionRequest(null, "Justification", 40))), "brandon");

        assertThat(created.getSlug()).isEqualTo("concevoir-un-cache-distribue");
        assertThat(created.getCreatedBy()).isEqualTo("brandon");
        assertThat(created.getTags()).containsExactly("Redis", "Performance");
        assertThat(created.getCriteria()).extracting(ChallengeCriterion::getPosition).containsExactly(0, 1);
        assertThat(created.totalPoints()).isEqualTo(100);
        assertThat(created.getPublishedAt()).isNotNull();
    }

    @Test
    @DisplayName("before any grading the rubric can be reshaped freely")
    void rubricIsFreeBeforeGrading() {
        when(challenges.findById(10L)).thenReturn(Optional.of(existing));
        when(submissions.existsByChallengeIdAndStatus(10L, SubmissionStatus.GRADED)).thenReturn(false);

        Challenge updated = service.update(10L, request(List.of(new CriterionRequest(2L, "Solution", 70), new CriterionRequest(null, "Clarté", 30))));

        assertThat(updated.getCriteria()).extracting(ChallengeCriterion::getLabel).containsExactly("Solution", "Clarté");
        assertThat(updated.totalPoints()).isEqualTo(100);
    }

    @Test
    @DisplayName("once an answer is graded, only the criteria labels may change")
    void gradedRubricAcceptsOnlyNewLabels() {
        when(challenges.findById(10L)).thenReturn(Optional.of(existing));
        when(submissions.existsByChallengeIdAndStatus(10L, SubmissionStatus.GRADED)).thenReturn(true);

        Challenge updated = service.update(10L, request(sameRubricRelabelled()));

        assertThat(updated.getCriteria()).extracting(ChallengeCriterion::getLabel).startsWith("Diagnostic");
        assertThat(updated.totalPoints()).isEqualTo(100);
    }

    @Test
    @DisplayName("once an answer is graded, changing the points or the criteria list is refused")
    void gradedRubricRefusesNewPoints() {
        when(challenges.findById(10L)).thenReturn(Optional.of(existing));
        when(submissions.existsByChallengeIdAndStatus(10L, SubmissionStatus.GRADED)).thenReturn(true);
        List<CriterionRequest> morePoints = List.of(
                new CriterionRequest(1L, "Diagnostic", 25),
                new CriterionRequest(2L, "Solution", 30),
                new CriterionRequest(3L, "Justification", 20),
                new CriterionRequest(4L, "Scalabilité", 15),
                new CriterionRequest(5L, "Compromis", 15));

        assertThatThrownBy(() -> service.update(10L, request(morePoints))).isInstanceOf(ConflictException.class);
        assertThatThrownBy(() -> service.update(10L, request(morePoints.subList(0, 4)))).isInstanceOf(ConflictException.class);
    }

    @Test
    @DisplayName("a challenge with answers cannot be deleted, only archived")
    void refusesDeletingAnsweredChallenge() {
        when(challenges.findById(10L)).thenReturn(Optional.of(existing));
        when(submissions.countByChallengeId(10L)).thenReturn(3L);

        assertThatThrownBy(() -> service.delete(10L)).isInstanceOf(ConflictException.class);
        verify(challenges, never()).delete(any());
    }

    @Test
    @DisplayName("a scheduled challenge stays hidden as a draft, then the scheduler publishes and dates it")
    void scheduledChallengeIsPublishedWhenDue() {
        Instant tomorrow = Instant.now().plus(1, ChronoUnit.DAYS);
        when(challenges.existsBySlug(any())).thenReturn(false);
        when(challenges.save(any(Challenge.class))).thenAnswer(call -> call.getArgument(0));

        Challenge created = service.create(request(List.of(new CriterionRequest(null, "Diagnostic", 100)), tomorrow), "admin");

        assertThat(created.getStatus()).isEqualTo(ChallengeStatus.DRAFT);
        assertThat(created.getPublishedAt()).isNull();

        created.setId(42L);
        when(challenges.findById(42L)).thenReturn(Optional.of(created));
        assertThat(service.publishScheduled(42L, tomorrow.minusSeconds(1))).isFalse();
        assertThat(service.publishScheduled(42L, tomorrow)).isTrue();
        assertThat(created.getStatus()).isEqualTo(ChallengeStatus.PUBLISHED);
        assertThat(created.getPublishedAt()).isEqualTo(tomorrow);
        assertThat(created.getScheduledAt()).isNull();
    }
}
