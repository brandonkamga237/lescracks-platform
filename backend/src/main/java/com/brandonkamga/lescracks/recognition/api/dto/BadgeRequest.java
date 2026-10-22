package com.brandonkamga.lescracks.recognition.api.dto;

import com.brandonkamga.lescracks.recognition.application.BadgeDraft;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record BadgeRequest(@NotBlank @Size(max = 80) String name, @NotBlank @Size(max = 300) String description,
                           @Size(max = 40) String icon) {

    public BadgeDraft toDraft() {
        return new BadgeDraft(name, description, icon);
    }
}
