package com.brandonkamga.lescracks.dto.resource;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

/** The file arrives as a multipart part beside this, not inside it. */
public record EbookRequest(
        @NotNull @Valid ResourceCommonRequest common,

        @Positive(message = "Le nombre de pages doit être supérieur à zéro.")
        Integer pageCount) {
}
