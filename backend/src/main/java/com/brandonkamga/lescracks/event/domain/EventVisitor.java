package com.brandonkamga.lescracks.event.domain;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.Locale;
import java.util.UUID;

/**
 * Someone opening an event page, reduced to a stable key: the same person counts once.
 * A member is keyed by a hash of their email, so the views table never stores an address.
 */
public record EventVisitor(String key) {

    public static EventVisitor member(String email) {
        return new EventVisitor("m:" + sha256(email.trim().toLowerCase(Locale.ROOT)));
    }

    public static EventVisitor anonymous(UUID browserId) {
        return new EventVisitor("a:" + browserId);
    }

    private static String sha256(String value) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException impossible) {
            throw new IllegalStateException("SHA-256 is part of every JVM", impossible);
        }
    }
}
