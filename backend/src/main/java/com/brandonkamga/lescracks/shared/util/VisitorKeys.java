package com.brandonkamga.lescracks.shared.util;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.Locale;
import java.util.UUID;

/**
 * Someone opening a page, reduced to a stable key so the same person counts once. A member is
 * keyed by a hash of their email, so a views table never stores an address.
 */
public final class VisitorKeys {

    private VisitorKeys() {
    }

    public static String member(String email) {
        return "m:" + sha256(email.trim().toLowerCase(Locale.ROOT));
    }

    public static String anonymous(UUID browserId) {
        return "a:" + browserId;
    }

    private static String sha256(String value) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException impossible) {
            throw new IllegalStateException("SHA-256 is part of every JVM", impossible);
        }
    }
}
