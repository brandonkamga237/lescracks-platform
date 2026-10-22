package com.brandonkamga.lescracks.engagement.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CommentEditRequest(@NotBlank @Size(max = 2000) String body) {
}
