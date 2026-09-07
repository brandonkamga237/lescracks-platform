package com.brandonkamga.lescracks.dto.auth;

public record UserAuthResponse(Long id, String email, String firstName, String lastName, boolean verified) {
}
