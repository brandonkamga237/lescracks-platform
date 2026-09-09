package com.brandonkamga.lescracks.dto.user;

import com.brandonkamga.lescracks.domain.AuthProvider;
import com.brandonkamga.lescracks.domain.UserStatus;

import java.time.Instant;
import java.util.List;
import java.util.Map;

public record UserProfileResponse(Long id, String email, String firstName, String lastName,
                                  UserStatus status, boolean verified, AuthProvider provider, Instant createdAt,
                                  String username, String avatarUrl, String bio, String location,
                                  Map<String, String> socialLinks, List<UserIdentityResponse> identities) {
}
