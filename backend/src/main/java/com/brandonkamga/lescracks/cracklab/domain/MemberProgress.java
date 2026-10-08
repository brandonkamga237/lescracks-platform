package com.brandonkamga.lescracks.cracklab.domain;

import com.brandonkamga.lescracks.identity.domain.User;

import java.util.List;

/**
 * Everything that makes a member's progress visible: XP and level, standing among the others,
 * this week's points, streak and badges. `rank` is 0 until a first answer is graded.
 */
public record MemberProgress(
        User member,
        long xp,
        Level level,
        int rank,
        int rankedMembers,
        int betterThanPercent,
        long pointsToNextRank,
        long weekScore,
        int answered,
        int graded,
        int averagePercent,
        int bestPercent,
        int streak,
        boolean activeThisWeek,
        int bestStreak,
        List<BadgeState> badges,
        List<Submission> history) {

    public record BadgeState(Badge badge, boolean unlocked) {
    }
}
