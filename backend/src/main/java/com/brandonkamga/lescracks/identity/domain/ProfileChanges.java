package com.brandonkamga.lescracks.identity.domain;

import java.util.Map;
import java.util.Set;

/**
 * A partial change of the profile: null leaves a field as it is, so each section of the page
 * sends only its own fields. An empty text clears an optional field (username, bio, city,
 * phone); first and last name can change but not be emptied.
 */
public record ProfileChanges(String firstName, String lastName, String username,
                             String bio, String location, Map<String, String> socialLinks, String phone,
                             MemberSituation situation, MemberGoal goal, Set<Long> interestIds,
                             Boolean marketingConsent) {
}
