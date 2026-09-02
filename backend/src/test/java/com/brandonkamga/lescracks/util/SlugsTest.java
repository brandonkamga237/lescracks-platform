package com.brandonkamga.lescracks.util;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class SlugsTest {

    @ParameterizedTest(name = "\"{0}\" -> \"{1}\"")
    @CsvSource(delimiter = '|', value = {
            "Réussir son entretien !          | reussir-son-entretien",
            "Déployer sur un VPS              | deployer-sur-un-vps",
            "C'est quoi, le TDD ?             | c-est-quoi-le-tdd",
            "Spring   Boot    3               | spring-boot-3",
            "  Marges  ' '                    | marges",
            "Ça coûte 100 €                   | ca-coute-100",
            "--- tirets ---                   | tirets",
            "Æther & Œuvre                    | ther-uvre",
    })
    @DisplayName("accents, punctuation and spacing all collapse into url-safe text")
    void turnsTitlesIntoUrlSafeText(String title, String expected) {
        assertThat(Slugs.from(title)).isEqualTo(expected);
    }

    @Test
    @DisplayName("a title of pure punctuation leaves nothing behind")
    void punctuationOnlyYieldsEmpty() {
        assertThat(Slugs.from("!!! ??? ...")).isEmpty();
    }

    @Test
    @DisplayName("a very long title is cut, and never ends on a dash")
    void longTitlesAreTruncated() {
        String slug = Slugs.from("mot ".repeat(100));

        assertThat(slug).hasSizeLessThanOrEqualTo(140);
        assertThat(slug).doesNotEndWith("-");
    }

    @Test
    @DisplayName("a free slug is used as is")
    void keepsTheBaseSlugWhenFree() {
        assertThat(Slugs.uniqueFrom("Le TDD", taken -> false)).isEqualTo("le-tdd");
    }

    @Test
    @DisplayName("a taken slug gets the first free numeric suffix")
    void suffixesUntilFree() {
        Set<String> used = Set.of("le-tdd", "le-tdd-2", "le-tdd-3");

        assertThat(Slugs.uniqueFrom("Le TDD", used::contains)).isEqualTo("le-tdd-4");
    }

    @Test
    @DisplayName("it gives up loudly rather than looping forever")
    void refusesWhenEverySuffixIsTaken() {
        assertThatThrownBy(() -> Slugs.uniqueFrom("Le TDD", taken -> true))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Le TDD");
    }
}
