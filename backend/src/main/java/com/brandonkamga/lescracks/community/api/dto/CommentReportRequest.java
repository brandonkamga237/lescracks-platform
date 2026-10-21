package com.brandonkamga.lescracks.community.api.dto;

import jakarta.validation.constraints.Size;

/** Why the member reports the comment; optional. */
public record CommentReportRequest(@Size(max = 300) String reason) {
}
