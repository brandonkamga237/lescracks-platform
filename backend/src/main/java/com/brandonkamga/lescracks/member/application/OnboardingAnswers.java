package com.brandonkamga.lescracks.member.application;

import com.brandonkamga.lescracks.account.application.Arrival;
import com.brandonkamga.lescracks.member.domain.model.MemberGoal;
import com.brandonkamga.lescracks.member.domain.model.MemberSituation;

import java.util.Set;

/** The welcome questions; every answer is optional. */
public record OnboardingAnswers(String phone, MemberSituation situation, MemberGoal goal,
                                Set<Long> interestIds, String location, Boolean marketingConsent,
                                Arrival arrival) {
}
