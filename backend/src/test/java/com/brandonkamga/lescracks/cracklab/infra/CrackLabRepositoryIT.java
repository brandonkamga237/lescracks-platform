package com.brandonkamga.lescracks.cracklab.infra;

import com.brandonkamga.lescracks.cracklab.domain.Challenge;
import com.brandonkamga.lescracks.cracklab.domain.ChallengeCriterion;
import com.brandonkamga.lescracks.cracklab.domain.ChallengeDifficulty;
import com.brandonkamga.lescracks.cracklab.domain.ChallengeStatus;
import com.brandonkamga.lescracks.cracklab.domain.Submission;
import com.brandonkamga.lescracks.cracklab.domain.SubmissionStatus;
import com.brandonkamga.lescracks.cracklab.domain.SubmissionVote;
import com.brandonkamga.lescracks.identity.domain.User;
import com.brandonkamga.lescracks.identity.infra.UserRepository;
import com.brandonkamga.lescracks.support.PostgresIT;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.PageRequest;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * CrackLab against real PostgreSQL: V18 must match the entities (ddl-auto: validate), and the
 * one-vote and one-answer rules must hold in the database itself, not only in the service.
 */
@Transactional
class CrackLabRepositoryIT extends PostgresIT {

    @Autowired private ChallengeRepository challenges;
    @Autowired private SubmissionRepository submissions;
    @Autowired private SubmissionVoteRepository votes;
    @Autowired private UserRepository users;

    private User member(String email, String firstName) {
        // The builder, not new User(): it applies the @Builder.Default status, provider and dates.
        return users.save(User.builder().email(email).firstName(firstName).lastName("Test").build());
    }

    private Challenge challenge(String slug, String tag) {
        Challenge challenge = new Challenge();
        challenge.setSlug(slug);
        challenge.setTitle("Challenge " + slug);
        challenge.setCategory("Backend");
        challenge.setDifficulty(ChallengeDifficulty.INTERMEDIATE);
        challenge.setProblem("Énoncé");
        challenge.setReferenceSolution("Solution");
        challenge.setStatus(ChallengeStatus.PUBLISHED);
        challenge.setCreatedBy("brandon");
        challenge.getTags().add(tag);
        ChallengeCriterion criterion = new ChallengeCriterion();
        criterion.setChallenge(challenge);
        criterion.setLabel("Solution");
        criterion.setMaxPoints(100);
        criterion.setPosition(0);
        challenge.getCriteria().add(criterion);
        return challenges.save(challenge);
    }

    private Submission answer(Challenge challenge, User user, Integer score) {
        Submission submission = new Submission();
        submission.setChallenge(challenge);
        submission.setUser(user);
        submission.setAnswer("Réponse");
        if (score != null) {
            submission.setTechnicalScore(score);
            submission.setStatus(SubmissionStatus.GRADED);
        }
        return submissions.saveAndFlush(submission);
    }

    private SubmissionVote vote(Submission submission, User user, int value) {
        SubmissionVote vote = new SubmissionVote();
        vote.setSubmission(submission);
        vote.setUser(user);
        vote.setValue((short) value);
        return votes.saveAndFlush(vote);
    }

    @Test
    @DisplayName("the database refuses a second vote by the same member on the same answer")
    void oneVotePerMemberAndSubmission() {
        Challenge challenge = challenge("cache", "Redis");
        User author = member("awa@example.com", "Awa");
        User voter = member("moussa@example.com", "Moussa");
        Submission submission = answer(challenge, author, 70);
        vote(submission, voter, 1);

        assertThatThrownBy(() -> vote(submission, voter, -1)).isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    @DisplayName("the database refuses a second answer by the same member to the same challenge")
    void oneAnswerPerMemberAndChallenge() {
        Challenge challenge = challenge("cache", "Redis");
        User author = member("awa@example.com", "Awa");
        answer(challenge, author, null);

        assertThatThrownBy(() -> answer(challenge, author, null)).isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    @DisplayName("the vote total is the sum of the stored votes, 0 when there are none")
    void voteTotalIsTheSumOfVotes() {
        Challenge challenge = challenge("cache", "Redis");
        Submission submission = answer(challenge, member("awa@example.com", "Awa"), 70);

        assertThat(votes.sumValues(submission.getId())).isZero();
        vote(submission, member("b@example.com", "B"), 1);
        vote(submission, member("c@example.com", "C"), 1);
        vote(submission, member("d@example.com", "D"), -1);

        assertThat(votes.sumValues(submission.getId())).isEqualTo(1);
    }

    @Test
    @DisplayName("the ranking sums graded scores only, best total first")
    void rankingSumsGradedScores() {
        Challenge first = challenge("cache", "Redis");
        Challenge second = challenge("queue", "Kafka");
        User awa = member("awa@example.com", "Awa");
        User moussa = member("moussa@example.com", "Moussa");
        answer(first, awa, 60);
        answer(second, awa, 50);
        answer(first, moussa, 90);
        answer(second, moussa, null);

        List<SubmissionRepository.RankingRow> rows = submissions.ranking(PageRequest.of(0, 10)).getContent();

        assertThat(rows).extracting(SubmissionRepository.RankingRow::getFirstName).containsExactly("Awa", "Moussa");
        assertThat(rows).extracting(SubmissionRepository.RankingRow::getTotalScore).containsExactly(110L, 90L);
        assertThat(rows).extracting(SubmissionRepository.RankingRow::getChallenges).containsExactly(2L, 1L);
    }

    @Test
    @DisplayName("the public search filters by tag and hides drafts")
    void searchFiltersByTagAndHidesDrafts() {
        challenge("cache", "Redis");
        challenge("queue", "Kafka");
        Challenge draft = challenge("draft", "Redis");
        draft.setStatus(ChallengeStatus.DRAFT);

        List<Challenge> found = challenges.search(ChallengeStatus.PUBLISHED, null, null, "Redis", PageRequest.of(0, 10)).getContent();

        assertThat(found).extracting(Challenge::getSlug).containsExactly("cache");
    }
}
