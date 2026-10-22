package com.brandonkamga.lescracks.engagement.application;

import com.brandonkamga.lescracks.engagement.domain.model.Comment;
import com.brandonkamga.lescracks.member.application.Member;

import java.util.List;

/** A comment as the admin reviews it: who wrote it, under what, and the reasons given by those who reported it. */
public record ModeratedComment(Comment comment, Member author, TargetPage target, List<String> reasons) {
}
