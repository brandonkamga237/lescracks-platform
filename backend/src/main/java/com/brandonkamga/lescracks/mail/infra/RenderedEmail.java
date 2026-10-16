package com.brandonkamga.lescracks.mail.infra;

/** What leaves: both parts carry the same content, the text one for clients and filters that want it. */
public record RenderedEmail(String subject, String html, String text) {
}
