package com.brandonkamga.lescracks.community.domain;

import com.brandonkamga.lescracks.identity.domain.member.User;
import com.brandonkamga.lescracks.resource.domain.Resource;

import java.util.List;

/** A comment as the admin reviews it: who wrote it, under which article, and the reasons given by those who reported it. */
public record ModeratedComment(Comment comment, User author, Resource resource, List<String> reasons) {
}
