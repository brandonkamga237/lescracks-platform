package com.brandonkamga.lescracks.identity.domain;

/**
 * Filters of the back-office user list; null means "any". {@code kind} separates members (who
 * can sign in) from newsletter-only contacts.
 */
public record UserSearch(String text, Kind kind, Boolean verified) {

    public enum Kind { MEMBER, CONTACT }
}
