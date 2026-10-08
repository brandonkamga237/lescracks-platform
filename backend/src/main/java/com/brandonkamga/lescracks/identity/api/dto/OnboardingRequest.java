package com.brandonkamga.lescracks.identity.api.dto;

import com.brandonkamga.lescracks.identity.domain.MemberGoal;
import com.brandonkamga.lescracks.identity.domain.MemberSituation;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Size;

import java.util.Set;

/** The welcome questions. Every answer is optional: "Plus tard" sends what was filled, or nothing. */
public record OnboardingRequest(
        @Size(max = 30) String phone,
        MemberSituation situation,
        MemberGoal goal,
        @Size(max = 10) Set<Long> interestIds,
        @Size(max = 100) String location,
        Boolean marketingConsent,
        @Valid SignupContext context) {
}
