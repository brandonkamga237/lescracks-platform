package com.brandonkamga.lescracks.mail.domain;

/** Sent after a sign-up from the public form; the newsletter starts once the link is followed. */
public record NewsletterConfirmation(String to, String token) implements Email {
}
