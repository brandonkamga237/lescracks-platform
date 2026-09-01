package com.brandonkamga.lescracks.dto.event;

import com.brandonkamga.lescracks.domain.EventKind;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.time.Instant;

/**
 * What an admin sends to create or edit an event.
 *
 * The start is required and the end is not: an event without a start is not scheduled, while
 * plenty of sessions never record when they finished. Whether the end precedes the start is
 * checked in the service, since a field annotation cannot compare two fields.
 */
public record EventRequest(
        @NotNull(message = "Précisez s'il s'agit d'un bootcamp ou d'un workshop.")
        EventKind kind,

        @NotBlank(message = "Le titre est obligatoire.")
        @Size(max = 200, message = "Le titre ne peut pas dépasser 200 caractères.")
        String title,

        @Size(max = 500, message = "Le résumé ne peut pas dépasser 500 caractères.")
        String summary,

        String description,

        @NotNull(message = "La date de début est obligatoire.")
        Instant startsAt,

        Instant endsAt,

        @Size(max = 200, message = "Le lieu ne peut pas dépasser 200 caractères.")
        String location,

        @Positive(message = "La capacité doit être supérieure à zéro, ou vide si illimitée.")
        Integer capacity,

        Long coverId) {
}
