package com.brandonkamga.lescracks.community.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CommentEditRequest(@NotBlank @Size(max = 2000) String body) {
}
