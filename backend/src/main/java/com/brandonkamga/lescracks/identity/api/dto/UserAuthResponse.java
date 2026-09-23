package com.brandonkamga.lescracks.identity.api.dto;

import com.brandonkamga.lescracks.identity.domain.AuthProvider;

public record UserAuthResponse(Long id, String email, String firstName, String lastName, boolean verified, AuthProvider provider) {
}
