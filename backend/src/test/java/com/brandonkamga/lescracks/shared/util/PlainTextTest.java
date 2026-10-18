package com.brandonkamga.lescracks.shared.util;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class PlainTextTest {

    @Test
    @DisplayName("headings, markers, emphasis and link targets go; words, numbers and code names stay")
    void keepsOnlyTheWords() {
        String markdown = """
                ## Le contexte

                Une **coopérative** de *trois* agences, `view_count` inclus.

                - Export en 30 s
                - Le [formulaire](https://forms.example/x) est ici
                """;

        assertThat(PlainText.of(markdown))
                .isEqualTo("Une coopérative de trois agences, view_count inclus. Export en 30 s Le formulaire est ici");
    }

    @Test
    void excerptCutsOnAWord() {
        assertThat(PlainText.excerpt("Un carnet qui ne perd jamais un franc", 20)).isEqualTo("Un carnet qui ne…");
        assertThat(PlainText.excerpt("Court", 20)).isEqualTo("Court");
        assertThat(PlainText.of(null)).isEmpty();
    }
}
