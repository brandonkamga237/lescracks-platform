package com.brandonkamga.lescracks.identity.domain;

import java.util.ArrayList;
import java.util.List;

/** How complete a member's profile is, and what is left: the profile page turns `missing` into prompts. */
public record ProfileCompletion(int percent, List<String> missing) {

    public static ProfileCompletion of(User user) {
        List<String> missing = new ArrayList<>();
        if (blank(user.getPhone())) missing.add("PHONE");
        if (user.getSituation() == null) missing.add("SITUATION");
        if (user.getInterests() == null || user.getInterests().isEmpty()) missing.add("INTERESTS");
        if (user.getGoal() == null) missing.add("GOAL");
        if (blank(user.getLocation())) missing.add("CITY");
        if (blank(user.getAvatarUrl())) missing.add("AVATAR");
        if (blank(user.getBio())) missing.add("BIO");
        int total = 7;
        return new ProfileCompletion(Math.round((total - missing.size()) * 100f / total), List.copyOf(missing));
    }

    private static boolean blank(String value) {
        return value == null || value.isBlank();
    }
}
