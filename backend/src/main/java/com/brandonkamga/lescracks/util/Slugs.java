package com.brandonkamga.lescracks.util;

import java.text.Normalizer;
import java.util.Locale;
import java.util.function.Predicate;
import java.util.regex.Pattern;

/**
 * Turns a title into the string that will appear in a URL.
 *
 * Slugs are part of the public contract: once shared, a link should keep working, so a slug
 * is generated once at creation and not recomputed when a title is edited.
 */
public final class Slugs {

    private static final Pattern NON_ALPHANUMERIC = Pattern.compile("[^a-z0-9]+");
    private static final Pattern EDGE_DASHES = Pattern.compile("(^-+)|(-+$)");
    private static final int MAX_LENGTH = 140;

    private Slugs() {
    }

    /** "Réussir son entretien !" becomes "reussir-son-entretien". */
    public static String from(String text) {
        String ascii = Normalizer.normalize(text, Normalizer.Form.NFD)
                .replaceAll("\\p{InCombiningDiacriticalMarks}+", "");
        String dashed = NON_ALPHANUMERIC.matcher(ascii.toLowerCase(Locale.ROOT)).replaceAll("-");
        String cut = dashed.length() > MAX_LENGTH ? dashed.substring(0, MAX_LENGTH) : dashed;
        // Trimmed after cutting, not before: the cut itself can land on a dash.
        return EDGE_DASHES.matcher(cut).replaceAll("");
    }

    /**
     * The same, with a numeric suffix if the caller says the slug is taken. Two articles may
     * legitimately share a title; their URLs may not.
     */
    public static String uniqueFrom(String text, Predicate<String> isTaken) {
        String base = from(text);
        if (!isTaken.test(base)) {
            return base;
        }
        for (int suffix = 2; suffix < 100; suffix++) {
            String candidate = base + "-" + suffix;
            if (!isTaken.test(candidate)) {
                return candidate;
            }
        }
        throw new IllegalStateException("No free slug for: " + text);
    }
}
