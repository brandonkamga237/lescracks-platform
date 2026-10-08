package com.brandonkamga.lescracks.cracklab.domain;

import com.brandonkamga.lescracks.cracklab.api.dto.GradeRequest;
import com.brandonkamga.lescracks.cracklab.api.dto.GradeRequest.CriterionGrade;
import com.brandonkamga.lescracks.cracklab.infra.SubmissionRepository;
import com.brandonkamga.lescracks.cracklab.infra.SubmissionVoteRepository;
import com.brandonkamga.lescracks.identity.domain.User;
import com.brandonkamga.lescracks.identity.domain.UserProfileService;
import com.brandonkamga.lescracks.shared.exception.BadRequestException;
import com.brandonkamga.lescracks.shared.exception.ConflictException;
import com.brandonkamga.lescracks.shared.exception.ForbiddenException;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static com.brandonkamga.lescracks.cracklab.domain.CrackLabFixtures.challenge;
import static com.brandonkamga.lescracks.cracklab.domain.CrackLabFixtures.member;
import static com.brandonkamga.lescracks.cracklab.domain.CrackLabFixtures.submission;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * The CrackLab rules that decide a score or a vote, with every collaborator mocked. The database
 * side of the same rules (unique constraints) is covered by CrackLabRepositoryIT.
 */
@ExtendWith(MockitoExtension.class)
class SubmissionServiceTest {

    @Mock private SubmissionRepository submissions;
    @Mock private SubmissionVoteRepository votes;
    @Mock private ChallengeService challenges;
    @Mock private UserProfileService profiles;

    private SubmissionServiceImpl service;
    private Challenge challenge;
    private User author;
    private User voter;

    @BeforeEach
    void setUp() {
        service = new SubmissionServiceImpl(submissions, votes, challenges, profiles);
        challenge = challenge(10, 5);
        author = member(1, "awa@example.com");
        voter = member(2, "moussa@example.com");
    }

    @Nested
    class Submitting {

        @BeforeEach
        void publishedChallenge() {
            when(challenges.requirePublished("cache-distribue")).thenReturn(challenge);
        }

        @Test
        @DisplayName("an answer within the word limit is saved, trimmed, waiting for grading")
        void savesAnswerWithinLimit() {
            when(profiles.find("awa@example.com")).thenReturn(Optional.of(author));
            when(submissions.save(any())).thenAnswer(call -> call.getArgument(0));

            Submission saved = service.submit("cache-distribue", "awa@example.com", "  Un cache Redis partagé.  ");

            assertThat(saved.getAnswer()).isEqualTo("Un cache Redis partagé.");
            assertThat(saved.getStatus()).isEqualTo(SubmissionStatus.SUBMITTED);
            assertThat(saved.getTechnicalScore()).isNull();
        }

        @Test
        @DisplayName("an answer over the word limit is refused with the count and the limit")
        void refusesAnswerOverWordLimit() {
            when(profiles.find("awa@example.com")).thenReturn(Optional.of(author));

            assertThatThrownBy(() -> service.submit("cache-distribue", "awa@example.com", "un deux trois quatre cinq six"))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("6 mots").hasMessageContaining("5");
            verify(submissions, never()).save(any());
        }

        @Test
        @DisplayName("a second answer to the same challenge is refused: a submission is final")
        void refusesSecondSubmission() {
            when(profiles.find("awa@example.com")).thenReturn(Optional.of(author));
            when(submissions.existsByChallengeIdAndUserId(10L, 1L)).thenReturn(true);

            assertThatThrownBy(() -> service.submit("cache-distribue", "awa@example.com", "Autre réponse"))
                    .isInstanceOf(ConflictException.class);
        }

        @Test
        @DisplayName("an admin account, which is not a member, cannot answer")
        void refusesAdminAccount() {
            when(profiles.find("brandon")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.submit("cache-distribue", "brandon", "Réponse"))
                    .isInstanceOf(ForbiddenException.class);
        }
    }

    @Nested
    class Grading {

        private Submission pending;

        @BeforeEach
        void pendingSubmission() {
            pending = submission(100, challenge, author);
            when(submissions.findById(100L)).thenReturn(Optional.of(pending));
        }

        private GradeRequest grades(int... points) {
            return new GradeRequest(List.of(
                    new CriterionGrade(1L, points[0], "Bien vu"),
                    new CriterionGrade(2L, points[1], null),
                    new CriterionGrade(3L, points[2], null),
                    new CriterionGrade(4L, points[3], null),
                    new CriterionGrade(5L, points[4], "Peu de compromis")));
        }

        @Test
        @DisplayName("the technical score is the sum of the points given per criterion")
        void scoreIsTheSumOfCriterionPoints() {
            Submission graded = service.grade(100L, grades(18, 25, 12, 10, 5), "brandon");

            assertThat(graded.getTechnicalScore()).isEqualTo(70);
            assertThat(graded.getStatus()).isEqualTo(SubmissionStatus.GRADED);
            assertThat(graded.getGradedBy()).isEqualTo("brandon");
            assertThat(graded.getEvaluations()).hasSize(5);
            assertThat(graded.getEvaluations().get(0).getFeedback()).isEqualTo("Bien vu");
        }

        @Test
        @DisplayName("full marks on every criterion reach exactly the rubric total")
        void fullMarksReachTheTotal() {
            assertThat(service.grade(100L, grades(20, 30, 20, 15, 15), "brandon").getTechnicalScore()).isEqualTo(100);
        }

        @Test
        @DisplayName("points above a criterion's maximum are refused")
        void refusesPointsAboveMaximum() {
            assertThatThrownBy(() -> service.grade(100L, grades(21, 25, 12, 10, 5), "brandon"))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("entre 0 et 20");
        }

        @Test
        @DisplayName("every criterion must be graded: a missing one is refused")
        void refusesMissingCriterion() {
            GradeRequest partial = new GradeRequest(List.of(new CriterionGrade(1L, 10, null)));

            assertThatThrownBy(() -> service.grade(100L, partial, "brandon"))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("Chaque critère");
        }

        @Test
        @DisplayName("a criterion graded twice, or one from another rubric, is refused")
        void refusesDuplicateOrForeignCriterion() {
            GradeRequest twice = new GradeRequest(List.of(new CriterionGrade(1L, 10, null), new CriterionGrade(1L, 5, null)));
            GradeRequest foreign = new GradeRequest(List.of(new CriterionGrade(99L, 10, null)));

            assertThatThrownBy(() -> service.grade(100L, twice, "brandon")).isInstanceOf(BadRequestException.class);
            assertThatThrownBy(() -> service.grade(100L, foreign, "brandon")).isInstanceOf(BadRequestException.class);
        }

        @Test
        @DisplayName("grading again replaces the grades in place instead of adding new ones")
        void regradingUpdatesInPlace() {
            service.grade(100L, grades(10, 10, 10, 10, 10), "brandon");
            Submission regraded = service.grade(100L, grades(20, 30, 20, 15, 0), "brandon");

            assertThat(regraded.getEvaluations()).hasSize(5);
            assertThat(regraded.getTechnicalScore()).isEqualTo(85);
        }
    }

    @Nested
    class Voting {

        private Submission answer;

        @BeforeEach
        void anotherMembersAnswer() {
            answer = submission(100, challenge, author);
            answer.setTechnicalScore(70);
            answer.setStatus(SubmissionStatus.GRADED);
            // Shared by most voting tests; the ones that stop earlier (bad value, own answer) leave them unused.
            lenient().when(submissions.findById(100L)).thenReturn(Optional.of(answer));
            lenient().when(profiles.find("moussa@example.com")).thenReturn(Optional.of(voter));
        }

        private void voterHasAnswered() {
            when(submissions.existsByChallengeIdAndUserId(10L, 2L)).thenReturn(true);
        }

        @Test
        @DisplayName("a first vote is saved and the total is recomputed from the votes")
        void firstVoteIsSavedAndTotalRecomputed() {
            voterHasAnswered();
            when(votes.findBySubmissionIdAndUserId(100L, 2L)).thenReturn(Optional.empty());
            when(votes.sumValues(100L)).thenReturn(3L);

            VoteResult result = service.vote(100L, "moussa@example.com", 1);

            ArgumentCaptor<SubmissionVote> saved = ArgumentCaptor.forClass(SubmissionVote.class);
            verify(votes).save(saved.capture());
            assertThat(saved.getValue().getValue()).isEqualTo((short) 1);
            assertThat(result).isEqualTo(new VoteResult(3, 1));
            assertThat(answer.getVoteScore()).isEqualTo(3);
        }

        @Test
        @DisplayName("voting again changes the existing vote: one vote per member, never two")
        void votingAgainUpdatesTheSameVote() {
            voterHasAnswered();
            SubmissionVote existing = new SubmissionVote();
            existing.setValue((short) 1);
            when(votes.findBySubmissionIdAndUserId(100L, 2L)).thenReturn(Optional.of(existing));
            when(votes.sumValues(100L)).thenReturn(-1L);

            VoteResult result = service.vote(100L, "moussa@example.com", -1);

            verify(votes, never()).save(any());
            assertThat(existing.getValue()).isEqualTo((short) -1);
            assertThat(result.voteScore()).isEqualTo(-1);
        }

        @Test
        @DisplayName("a vote of 0 withdraws the member's vote")
        void zeroWithdrawsTheVote() {
            voterHasAnswered();
            SubmissionVote existing = new SubmissionVote();
            existing.setValue((short) 1);
            when(votes.findBySubmissionIdAndUserId(100L, 2L)).thenReturn(Optional.of(existing));
            when(votes.sumValues(100L)).thenReturn(0L);

            VoteResult result = service.vote(100L, "moussa@example.com", 0);

            verify(votes).delete(existing);
            assertThat(result).isEqualTo(new VoteResult(0, 0));
        }

        @Test
        @DisplayName("votes never touch the technical score")
        void votesNeverChangeTheTechnicalScore() {
            voterHasAnswered();
            when(votes.findBySubmissionIdAndUserId(100L, 2L)).thenReturn(Optional.empty());
            when(votes.sumValues(100L)).thenReturn(12L);

            service.vote(100L, "moussa@example.com", 1);

            assertThat(answer.getTechnicalScore()).isEqualTo(70);
        }

        @Test
        @DisplayName("a member cannot vote for their own answer")
        void cannotVoteForOwnAnswer() {
            when(profiles.find("awa@example.com")).thenReturn(Optional.of(author));

            assertThatThrownBy(() -> service.vote(100L, "awa@example.com", 1)).isInstanceOf(ForbiddenException.class);
            verify(votes, never()).save(any());
        }

        @Test
        @DisplayName("only members who answered the challenge may vote on its answers")
        void mustHaveAnsweredToVote() {
            when(submissions.existsByChallengeIdAndUserId(10L, 2L)).thenReturn(false);

            assertThatThrownBy(() -> service.vote(100L, "moussa@example.com", 1)).isInstanceOf(ForbiddenException.class);
        }

        @Test
        @DisplayName("a vote other than +1, -1 or 0 is refused")
        void refusesOtherValues() {
            assertThatThrownBy(() -> service.vote(100L, "moussa@example.com", 2)).isInstanceOf(BadRequestException.class);
        }
    }
}
