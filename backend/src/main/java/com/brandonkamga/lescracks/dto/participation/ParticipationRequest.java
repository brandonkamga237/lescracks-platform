package com.brandonkamga.lescracks.dto.participation;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

/** What an admin sends to record a participation directly, with no application behind it. */
public record ParticipationRequest(
        @NotNull(message = "La personne est obligatoire.")
        Long userId,

        /** Null means the Accompagnement 360. */
        Long eventId,

        @Size(max = 100, message = "Le nom de la cohorte ne peut pas dépasser 100 caractères.")
        String cohort,

        LocalDate startedAt) {
}
