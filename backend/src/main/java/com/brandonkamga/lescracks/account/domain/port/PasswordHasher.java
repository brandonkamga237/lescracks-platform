package com.brandonkamga.lescracks.identity.domain.credential;

/** One-way password hashing. Which algorithm is the infrastructure's choice, not the domain's. */
public interface PasswordHasher {

    String hash(String rawPassword);

    boolean matches(String rawPassword, String hash);
}
