package com.brandonkamga.lescracks.account.domain.model;

/**
 * Filters of the back-office account list; null means "any". {@code kind} separates members (who
 * can sign in) from newsletter-only contacts.
 */
public record AccountSearch(String text, Kind kind, Boolean verified) {

    public static final AccountSearch ANYONE = new AccountSearch(null, null, null);

    public enum Kind { MEMBER, CONTACT }
}
