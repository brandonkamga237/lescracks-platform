package com.brandonkamga.lescracks.community.domain;

import com.brandonkamga.lescracks.member.application.Member;
import com.brandonkamga.lescracks.resource.domain.Resource;

import java.util.List;

/** A comment as the admin reviews it: who wrote it, under which article, and the reasons given by those who reported it. */
public record ModeratedComment(Comment comment, Member author, Resource resource, List<String> reasons) {
}
