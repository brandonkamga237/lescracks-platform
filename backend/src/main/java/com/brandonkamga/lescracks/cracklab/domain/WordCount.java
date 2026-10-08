package com.brandonkamga.lescracks.cracklab.domain;

/** Words as a reader counts them: runs of non-space characters. The frontend counts the same way. */
public final class WordCount {

    private WordCount() {
    }

    public static int of(String text) {
        if (text == null || text.isBlank()) {
            return 0;
        }
        return text.trim().split("\\s+").length;
    }
}
