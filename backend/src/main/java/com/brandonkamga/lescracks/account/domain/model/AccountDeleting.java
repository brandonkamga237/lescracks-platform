package com.brandonkamga.lescracks.account.domain.model;

/**
 * Published just before an account is deleted, in the same transaction. The database cascades
 * the member's rows away; listeners use this moment to correct what those rows were counted in.
 */
public record AccountDeleting(Long accountId) {
}
