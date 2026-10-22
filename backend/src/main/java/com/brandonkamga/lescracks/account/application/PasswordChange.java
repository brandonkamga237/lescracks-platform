package com.brandonkamga.lescracks.account.application;

public record PasswordChange(String currentPassword, String newPassword, String confirmation) {
}
