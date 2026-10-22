package com.brandonkamga.lescracks.account.domain.model;

/** What an identity provider vouches for, read from a verified token. Any claim may be missing. */
public record IdentityClaims(String subject, String email, Boolean emailVerified,
                             String givenName, String familyName, String name, String preferredUsername) {
}
