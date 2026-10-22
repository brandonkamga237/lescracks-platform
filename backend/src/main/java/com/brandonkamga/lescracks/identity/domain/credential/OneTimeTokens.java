package com.brandonkamga.lescracks.identity.domain.credential;


import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.Base64;

/**
 * Tokens sent by email (address verification, password reset). The raw value only ever travels
 * in the email; the database keeps its SHA-256, so a leaked table cannot be replayed.
 */
public class OneTimeTokens {

    public record Issued(String raw, String hash) {
    }

    private final SecureRandom random = new SecureRandom();

    public Issued issue() {
        byte[] bytes = new byte[32];
        random.nextBytes(bytes);
        String raw = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        return new Issued(raw, hash(raw));
    }

    public String hash(String raw) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(raw.getBytes(StandardCharsets.UTF_8));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(digest);
        } catch (NoSuchAlgorithmException impossible) {
            throw new IllegalStateException("SHA-256 is part of every JVM", impossible);
        }
    }
}
