package com.brandonkamga.lescracks.account.domain.model;

/** Filters of the back-office account list; null means "any". */
public record AccountSearch(String text, Boolean verified) {

    public static final AccountSearch ANYONE = new AccountSearch(null, null);
}
