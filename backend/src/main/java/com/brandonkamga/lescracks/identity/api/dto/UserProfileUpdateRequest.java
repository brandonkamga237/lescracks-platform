package com.brandonkamga.lescracks.identity.api.dto;

import com.brandonkamga.lescracks.identity.domain.ProfileChanges;
import com.brandonkamga.lescracks.identity.domain.MemberGoal;
import com.brandonkamga.lescracks.identity.domain.MemberSituation;

import jakarta.validation.constraints.Size;

import java.util.Map;
import java.util.Set;

public record UserProfileUpdateRequest(
        @Size(max = 120) String firstName,
        @Size(max = 120) String lastName,
        @Size(max = 50) String username,
        @Size(max = 2000) String bio,
        @Size(max = 100) String location,
        Map<String, String> socialLinks,
        /** Null leaves the number as it is; an empty string removes it. */
        @Size(max = 30) String phone,
        MemberSituation situation,
        MemberGoal goal,
        /** Null leaves the interests as they are. */
        @Size(max = 10) Set<Long> interestIds,
        Boolean marketingConsent
) {

    public ProfileChanges toChanges() {
        return new ProfileChanges(firstName, lastName, username, bio, location, socialLinks, phone,
                situation, goal, interestIds, marketingConsent);
    }
}
