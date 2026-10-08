package com.brandonkamga.lescracks.cracklab.api.dto;

import com.brandonkamga.lescracks.cracklab.domain.ChallengeDifficulty;
import com.brandonkamga.lescracks.cracklab.domain.ChallengeStatus;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.util.List;

public record ChallengeRequest(
        @NotBlank @Size(max = 200) String title,
        @NotBlank @Size(max = 80) String category,
        @NotNull ChallengeDifficulty difficulty,
        List<@NotBlank @Size(max = 60) String> tags,
        @NotBlank String problem,
        String constraints,
        @Size(max = 300) String expectedFormat,
        @Positive Integer maxWords,
        @NotBlank String referenceSolution,
        @NotEmpty @Valid List<CriterionRequest> criteria,
        ChallengeStatus status) {

    /** `id` is set for a criterion that already exists, so its grades stay attached to it. */
    public record CriterionRequest(Long id, @NotBlank @Size(max = 200) String label, @NotNull @Positive Integer maxPoints) {
    }
}
