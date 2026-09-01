package com.brandonkamga.lescracks.dto.mentorship;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record MentorshipRequest(
        @NotBlank(message = "Le titre est obligatoire.")
        @Size(max = 200, message = "Le titre ne peut pas dépasser 200 caractères.")
        String title,

        @Size(max = 500, message = "Le résumé ne peut pas dépasser 500 caractères.")
        String summary,

        String description,
        Long coverId) {
}
