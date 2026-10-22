package com.brandonkamga.lescracks.identity.domain.credential;

public record PasswordChange(String currentPassword, String newPassword, String confirmation) {
}
