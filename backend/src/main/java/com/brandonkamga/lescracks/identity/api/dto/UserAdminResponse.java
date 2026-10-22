package com.brandonkamga.lescracks.identity.api.dto;

import com.brandonkamga.lescracks.identity.domain.member.AuthProvider;
import com.brandonkamga.lescracks.identity.domain.member.MemberGoal;
import com.brandonkamga.lescracks.identity.domain.member.MemberSituation;
import com.brandonkamga.lescracks.identity.domain.member.UserStatus;

import java.time.Instant;

public record UserAdminResponse(Long id, String email, String firstName, String lastName,
                                UserStatus status, boolean verified, AuthProvider provider, Instant createdAt,
                                String phone, String country, MemberSituation situation, MemberGoal goal,
                                String location, boolean marketingConsent, int completion,
                                /** False for a newsletter-only contact. */
                                boolean hasAccount, boolean onboarded, Instant lastSeenAt, String signupPath) {
}