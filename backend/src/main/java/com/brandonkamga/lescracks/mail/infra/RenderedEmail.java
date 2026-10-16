package com.brandonkamga.lescracks.mail.infra;

import java.util.Map;

/**
 * What leaves: both parts carry the same content, the text one for clients and filters that want
 * it. {@code headers} are extra message headers (List-Unsubscribe for the newsletter).
 */
public record RenderedEmail(String subject, String html, String text, Map<String, String> headers) {

    public RenderedEmail(String subject, String html, String text) {
        this(subject, html, text, Map.of());
    }
}
