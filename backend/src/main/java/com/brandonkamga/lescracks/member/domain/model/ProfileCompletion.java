package com.brandonkamga.lescracks.member.domain.model;

import java.util.ArrayList;
import java.util.List;

/** How complete a member's profile is, and what is left: the profile page turns `missing` into prompts. */
public record ProfileCompletion(int percent, List<String> missing) {

    public static ProfileCompletion of(MemberProfile profile) {
        List<String> missing = new ArrayList<>();
        if (blank(profile.getPhone())) missing.add("PHONE");
        if (profile.getSituation() == null) missing.add("SITUATION");
        if (profile.getInterests() == null || profile.getInterests().isEmpty()) missing.add("INTERESTS");
        if (profile.getGoal() == null) missing.add("GOAL");
        if (blank(profile.getLocation())) missing.add("CITY");
        if (blank(profile.getAvatarUrl())) missing.add("AVATAR");
        if (blank(profile.getBio())) missing.add("BIO");
        int total = 7;
        return new ProfileCompletion(Math.round((total - missing.size()) * 100f / total), List.copyOf(missing));
    }

    private static boolean blank(String value) {
        return value == null || value.isBlank();
    }
}
