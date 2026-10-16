package com.brandonkamga.lescracks.identity.domain;

import java.util.Map;
import java.util.Set;

/**
 * The profile form. Replaces every plain field; for phone, situation, goal, interests,
 * social links and consent, null leaves the current value as it is.
 */
public record ProfileChanges(String firstName, String lastName, String username,
                             String bio, String location, Map<String, String> socialLinks, String phone,
                             MemberSituation situation, MemberGoal goal, Set<Long> interestIds,
                             Boolean marketingConsent) {
}
