package com.brandonkamga.lescracks.recognition.domain.model;

import java.security.SecureRandom;

/**
 * Codes people read aloud or type from a printed page: ten characters without the ones that look
 * alike (0/O, 1/I/L), about 10^14 combinations, so guessing one is hopeless.
 */
public final class CertificateCodes {
    private static final char[] ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789".toCharArray();
    private static final SecureRandom RANDOM = new SecureRandom();
    static final int LENGTH = 10;

    private CertificateCodes() {
    }

    public static String next() {
        char[] code = new char[LENGTH];
        for (int i = 0; i < LENGTH; i++) code[i] = ALPHABET[RANDOM.nextInt(ALPHABET.length)];
        return new String(code);
    }
}
