package com.brandonkamga.lescracks.identity.domain;

import java.util.Set;

/** The welcome questions; every answer is optional. */
public record OnboardingAnswers(String phone, MemberSituation situation, MemberGoal goal,
                                Set<Long> interestIds, String location, Boolean marketingConsent,
                                Arrival arrival) {
}
