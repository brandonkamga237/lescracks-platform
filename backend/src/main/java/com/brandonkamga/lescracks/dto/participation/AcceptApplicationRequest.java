package com.brandonkamga.lescracks.dto.participation;

import jakarta.validation.constraints.Size;

import java.time.LocalDate;

/** What an admin adds when turning an accepted application into a participation. */
public record AcceptApplicationRequest(
        @Size(max = 100, message = "Le nom de la cohorte ne peut pas dépasser 100 caractères.")
        String cohort,

        LocalDate startedAt) {
}
