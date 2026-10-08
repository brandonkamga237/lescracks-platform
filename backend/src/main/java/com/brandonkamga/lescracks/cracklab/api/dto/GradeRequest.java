package com.brandonkamga.lescracks.cracklab.api.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

public record GradeRequest(@NotEmpty @Valid List<CriterionGrade> criteria) {

    public record CriterionGrade(@NotNull Long criterionId, @NotNull @Min(0) Integer points, @Size(max = 4000) String feedback) {
    }
}
