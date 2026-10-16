package com.brandonkamga.lescracks.identity.domain;

public record PasswordChange(String currentPassword, String newPassword, String confirmation) {
}
