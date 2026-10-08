package com.brandonkamga.lescracks.cracklab.domain;

import com.brandonkamga.lescracks.identity.domain.User;

import java.util.List;

/** Minimal CrackLab objects with ids set, as if read back from the database. */
final class CrackLabFixtures {

    private CrackLabFixtures() {
    }

    static User member(long id, String email) {
        User user = new User();
        user.setId(id);
        user.setEmail(email);
        user.setFirstName("Awa");
        user.setLastName("Ndiaye");
        return user;
    }

    static ChallengeCriterion criterion(Challenge challenge, long id, String label, int maxPoints, int position) {
        ChallengeCriterion criterion = new ChallengeCriterion();
        criterion.setId(id);
        criterion.setChallenge(challenge);
        criterion.setLabel(label);
        criterion.setMaxPoints(maxPoints);
        criterion.setPosition(position);
        return criterion;
    }

    /** The rubric from the brief: 20 + 30 + 20 + 15 + 15 = 100. */
    static Challenge challenge(long id, Integer maxWords) {
        Challenge challenge = new Challenge();
        challenge.setId(id);
        challenge.setSlug("cache-distribue");
        challenge.setTitle("Concevoir un cache distribué");
        challenge.setCategory("Backend");
        challenge.setDifficulty(ChallengeDifficulty.INTERMEDIATE);
        challenge.setProblem("Une API répond en 2 s sous charge.");
        challenge.setReferenceSolution("Cache Redis devant la base, invalidation par événement.");
        challenge.setStatus(ChallengeStatus.PUBLISHED);
        challenge.setCreatedBy("brandon");
        challenge.setMaxWords(maxWords);
        challenge.getCriteria().addAll(List.of(
                criterion(challenge, 1, "Identification du problème", 20, 0),
                criterion(challenge, 2, "Solution", 30, 1),
                criterion(challenge, 3, "Justification", 20, 2),
                criterion(challenge, 4, "Scalabilité", 15, 3),
                criterion(challenge, 5, "Trade-offs", 15, 4)));
        return challenge;
    }

    static Submission submission(long id, Challenge challenge, User author) {
        Submission submission = new Submission();
        submission.setId(id);
        submission.setChallenge(challenge);
        submission.setUser(author);
        submission.setAnswer("Je mettrais un cache Redis devant la base.");
        return submission;
    }
}
