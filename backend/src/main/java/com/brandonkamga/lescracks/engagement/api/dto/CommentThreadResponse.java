package com.brandonkamga.lescracks.engagement.api.dto;

import com.brandonkamga.lescracks.engagement.application.CommentThread;

import java.util.List;

public record CommentThreadResponse(CommentResponse comment, List<CommentResponse> replies) {

    public static CommentThreadResponse of(CommentThread thread, String viewerEmail) {
        return new CommentThreadResponse(CommentResponse.of(thread.root(), viewerEmail),
                thread.replies().stream().map(reply -> CommentResponse.of(reply, viewerEmail)).toList());
    }
}
