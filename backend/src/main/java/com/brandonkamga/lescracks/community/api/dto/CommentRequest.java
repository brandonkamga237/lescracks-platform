package com.brandonkamga.lescracks.community.api.dto;

import com.brandonkamga.lescracks.community.domain.CommentDraft;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** A new comment; parentId set for a reply. */
public record CommentRequest(@NotBlank @Size(max = 2000) String body, Long parentId) {

    public CommentDraft toDraft() {
        return new CommentDraft(body, parentId);
    }
}
