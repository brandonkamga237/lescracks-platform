package com.brandonkamga.lescracks.util;

import com.brandonkamga.lescracks.exception.BadRequestException;

import java.util.regex.Pattern;

/**
 * Stateless utility for enforcing password complexity requirements.
 *
 * Rules:
 *   - At least 8 characters
 *   - At least one uppercase letter (A-Z)
 *   - At least one lowercase letter (a-z)
 *   - At least one digit (0-9)
 *   - At least one special character (non-alphanumeric)
 */
public final class PasswordValidator {

    private static final int MIN_LENGTH = 8;
    private static final Pattern UPPERCASE = Pattern.compile("[A-Z]");
    private static final Pattern LOWERCASE = Pattern.compile("[a-z]");
    private static final Pattern DIGIT     = Pattern.compile("[0-9]");
    private static final Pattern SPECIAL   = Pattern.compile("[^A-Za-z0-9]");

    private PasswordValidator() {}

    /**
     * Validate password complexity. Throws {@link BadRequestException} on failure.
     *
     * @param password the raw password to validate
     */
    public static void validate(String password) {
        if (password == null || password.length() < MIN_LENGTH) {
            throw new BadRequestException(
                    "Le mot de passe doit contenir au moins " + MIN_LENGTH + " caractères.");
        }
        if (!UPPERCASE.matcher(password).find()) {
            throw new BadRequestException(
                    "Le mot de passe doit contenir au moins une majuscule.");
        }
        if (!LOWERCASE.matcher(password).find()) {
            throw new BadRequestException(
                    "Le mot de passe doit contenir au moins une minuscule.");
        }
        if (!DIGIT.matcher(password).find()) {
            throw new BadRequestException(
                    "Le mot de passe doit contenir au moins un chiffre.");
        }
        if (!SPECIAL.matcher(password).find()) {
            throw new BadRequestException(
                    "Le mot de passe doit contenir au moins un caractère spécial.");
        }
    }
}
