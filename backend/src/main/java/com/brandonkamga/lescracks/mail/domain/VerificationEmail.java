package com.brandonkamga.lescracks.mail.domain;

public record VerificationEmail(String to, String firstName, String token) implements Email {
}
