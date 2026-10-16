package com.brandonkamga.lescracks.mail.domain;

public record PasswordResetEmail(String to, String token) implements Email {
}
