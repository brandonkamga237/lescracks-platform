package com.brandonkamga.lescracks.stats.api.dto;

import java.util.List;

/**
 * Who the members are, from what they told the welcome questions and their profile. Each list
 * counts members, fullest first; a member who skipped a question is simply not in that list.
 */
public record MemberPortraitResponse(
        long members,
        List<NamedCount> situations,
        List<NamedCount> goals,
        List<NamedCount> countries,
        List<NamedCount> interests,
        List<NamedCount> providers) {
}
