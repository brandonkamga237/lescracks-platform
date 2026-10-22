package com.brandonkamga.lescracks.engagement.domain.model;

/** What a card shows of a piece of content's audience. */
public record Counts(int views, int likes) {

    public static final Counts NONE = new Counts(0, 0);
}
