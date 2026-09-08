package com.brandonkamga.lescracks.dto.auth;

import com.brandonkamga.lescracks.domain.AuthProvider;

public record UserAuthResponse(Long id, String email, String firstName, String lastName, boolean verified, AuthProvider provider) {
}
