package com.brandonkamga.lescracks.shared.util;

/**
 * Markdown reduced to plain words, for meta descriptions and bot snapshots: block markers,
 * emphasis and link targets go. Mirrors frontend/src/lib/plainText.ts.
 */
public final class PlainText {

    private PlainText() {
    }

    public static String of(String markdown) {
        if (markdown == null) return "";
        return markdown
                .replaceAll("(?s)```.*?```", " ")
                .replaceAll("!\\[[^\\]]*]\\([^)]*\\)", " ")
                .replaceAll("\\[([^\\]]+)]\\([^)]*\\)", "$1")
                .replaceAll("(?m)^\\s{0,3}(#{1,6}|>|[-*+]|\\d+[.)])\\s+", "")
                .replaceAll("\\*\\*([^*]+)\\*\\*", "$1")
                .replaceAll("\\*([^*\\s][^*]*)\\*", "$1")
                .replaceAll("`([^`]+)`", "$1")
                .replaceAll("\\s+", " ")
                .trim();
    }

    /** At most {@code max} characters, cut on a word with an ellipsis. */
    public static String excerpt(String markdown, int max) {
        String text = of(markdown);
        if (text.length() <= max) return text;
        int cut = text.lastIndexOf(' ', max - 1);
        return text.substring(0, cut > 0 ? cut : max - 1) + "…";
    }
}
