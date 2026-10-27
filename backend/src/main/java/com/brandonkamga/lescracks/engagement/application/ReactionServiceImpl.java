package com.brandonkamga.lescracks.engagement.application;

import com.brandonkamga.lescracks.engagement.domain.model.Counts;
import com.brandonkamga.lescracks.engagement.domain.model.Target;
import com.brandonkamga.lescracks.engagement.domain.model.TargetType;
import com.brandonkamga.lescracks.engagement.domain.port.CommentStore;
import com.brandonkamga.lescracks.engagement.domain.port.ReactionStore;
import com.brandonkamga.lescracks.member.application.MemberDirectory;

import java.util.Collection;
import java.util.HashMap;
import java.util.Map;

public class ReactionServiceImpl implements ReactionService, EngagementCounts {
    private final ReactionStore reactions;
    private final CommentStore comments;
    private final TargetRegistry targets;
    private final MemberDirectory people;

    public ReactionServiceImpl(ReactionStore reactions, CommentStore comments, TargetRegistry targets, MemberDirectory people) {
        this.reactions = reactions;
        this.comments = comments;
        this.targets = targets;
        this.people = people;
    }

    @Override
    public int recordView(Target target, String visitorKey) {
        targets.requireOpen(target);
        reactions.addView(target, visitorKey);
        return reactions.counts(target).views();
    }

    @Override
    public LikeStatus viewLikes(Target target, String email) {
        boolean liked = email != null && !email.isBlank()
                && people.find(email).map(member -> reactions.hasLiked(target, member.getId())).orElse(false);
        return new LikeStatus(reactions.counts(target).likes(), liked);
    }

    @Override
    public LikeStatus like(Target target, String email) {
        targets.requireOpen(target);
        reactions.addLike(target, people.require(email).getId());
        return new LikeStatus(reactions.counts(target).likes(), true);
    }

    @Override
    public LikeStatus unlike(Target target, String email) {
        reactions.removeLike(target, people.require(email).getId());
        return new LikeStatus(reactions.counts(target).likes(), false);
    }

    @Override
    public Counts countsOf(Target target) {
        return reactions.counts(target);
    }

    @Override
    public Map<Long, Counts> countsOf(TargetType type, Collection<Long> ids) {
        if (ids.isEmpty()) return Map.of();
        Map<Long, Counts> found = reactions.counts(type, ids);
        Map<Long, Counts> all = new HashMap<>();
        ids.forEach(id -> all.put(id, found.getOrDefault(id, Counts.NONE)));
        return all;
    }

    @Override
    public Map<Long, Counts> listMostLiked(TargetType type, int limit) {
        return reactions.mostLiked(type, limit);
    }

    @Override
    public void forget(Target target) {
        reactions.forget(target);
        comments.deleteByTarget(target);
    }

    @Override
    public void forgetMember(Long accountId) {
        reactions.releaseLikesOf(accountId);
    }
}
