package com.brandonkamga.lescracks.identity.domain.member;

/**
 * Filters of the back-office user list; null means "any". {@code kind} separates members (who
 * can sign in) from newsletter-only contacts.
 */
public record UserSearch(String text, Kind kind, Boolean verified) {

    public static final UserSearch ANYONE = new UserSearch(null, null, null);

    public enum Kind { MEMBER, CONTACT }
}
