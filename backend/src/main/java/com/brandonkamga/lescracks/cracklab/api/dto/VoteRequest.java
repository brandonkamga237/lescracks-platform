package com.brandonkamga.lescracks.cracklab.api.dto;

import jakarta.validation.constraints.NotNull;

/** +1 up, -1 down, 0 withdraws the vote. */
public record VoteRequest(@NotNull Integer value) {
}
