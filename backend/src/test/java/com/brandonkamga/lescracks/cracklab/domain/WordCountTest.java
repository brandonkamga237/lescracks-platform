package com.brandonkamga.lescracks.cracklab.domain;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class WordCountTest {

    @Test
    @DisplayName("a word is a run of non-space characters, whatever whitespace separates them")
    void countsRunsOfNonSpaceCharacters() {
        assertThat(WordCount.of("Un cache  Redis\n devant\tla base.")).isEqualTo(6);
    }

    @Test
    @DisplayName("nothing or only whitespace is zero words")
    void blankTextHasNoWords() {
        assertThat(WordCount.of(null)).isZero();
        assertThat(WordCount.of("   \n ")).isZero();
    }
}
