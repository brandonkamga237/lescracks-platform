package com.brandonkamga.lescracks.account.domain.model;

/** Published in the transaction that changes a member's name, for the modules that keep a copy. */
public record AccountRenamed(Long accountId, String email, String firstName, String lastName) {
}
