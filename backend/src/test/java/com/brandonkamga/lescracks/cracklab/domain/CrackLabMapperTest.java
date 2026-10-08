package com.brandonkamga.lescracks.cracklab.domain;

import com.brandonkamga.lescracks.cracklab.api.dto.ChallengeDetailResponse;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static com.brandonkamga.lescracks.cracklab.domain.CrackLabFixtures.challenge;
import static com.brandonkamga.lescracks.cracklab.domain.CrackLabFixtures.member;
import static com.brandonkamga.lescracks.cracklab.domain.CrackLabFixtures.submission;
import static org.assertj.core.api.Assertions.assertThat;

@ExtendWith(MockitoExtension.class)
class CrackLabMapperTest {

    @Mock private ChallengeService challenges;

    @Test
    @DisplayName("the reference solution stays hidden from a viewer who has not answered")
    void referenceSolutionHiddenBeforeSubmitting() {
        CrackLabMapper mapper = new CrackLabMapper(challenges);
        Challenge challenge = challenge(10, null);

        ChallengeDetailResponse visitor = mapper.detail(challenge, null);
        ChallengeDetailResponse answered = mapper.detail(challenge, mapper.submission(submission(1, challenge, member(1, "a@b.c")), 1L, 0));

        assertThat(visitor.referenceSolution()).isNull();
        assertThat(answered.referenceSolution()).isEqualTo(challenge.getReferenceSolution());
    }

    @Test
    @DisplayName("members appear as first name and last initial, never by email")
    void displayNameNeverShowsEmail() {
        assertThat(CrackLabMapper.displayName("Awa", "ndiaye", null)).isEqualTo("Awa N.");
        assertThat(CrackLabMapper.displayName(" ", null, "awa_dev")).isEqualTo("awa_dev");
        assertThat(CrackLabMapper.displayName(null, null, null)).isEqualTo("Membre LesCracks");
    }
}
