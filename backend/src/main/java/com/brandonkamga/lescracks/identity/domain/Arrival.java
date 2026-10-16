package com.brandonkamga.lescracks.identity.domain;

/** Where and how someone arrived, as the browser reported it on their first visit. */
public record Arrival(String path, String language, String timezone) {
}
