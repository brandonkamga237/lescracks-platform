package com.brandonkamga.lescracks.shared.util;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class SlugsTest {

    @Test
    @DisplayName("accents and punctuation leave the url")
    void stripsAccentsAndPunctuation() {
        assertThat(Slugs.from("Réussir son entretien !")).isEqualTo("reussir-son-entretien");
        assertThat(Slugs.from("C'est déjà ça — vraiment ?")).isEqualTo("c-est-deja-ca-vraiment");
    }

    @Test
    void collapsesRunsOfSeparatorsAndTrimsTheEdges() {
        assertThat(Slugs.from("  Spring   Boot  ")).isEqualTo("spring-boot");
        assertThat(Slugs.from("--- hello ---")).isEqualTo("hello");
    }

    @Test
    @DisplayName("a long title is cut to 140 characters and never ends on a dash")
    void cutsLongTitlesWithoutLeavingATrailingDash() {
        String slug = Slugs.from("a".repeat(100) + " " + "b".repeat(80));

        assertThat(slug).hasSize(140).doesNotEndWith("-");
    }

    @Test
    void returnsTheBaseSlugWhenItIsFree() {
        assertThat(Slugs.uniqueFrom("Spring Boot", taken -> false)).isEqualTo("spring-boot");
    }

    @Test
    @DisplayName("two articles may share a title, their urls may not")
    void suffixesUntilTheSlugIsFree() {
        Set<String> used = Set.of("spring-boot", "spring-boot-2");

        assertThat(Slugs.uniqueFrom("Spring Boot", used::contains)).isEqualTo("spring-boot-3");
    }

    @Test
    void failsLoudlyRatherThanReturningATakenSlug() {
        assertThatThrownBy(() -> Slugs.uniqueFrom("Spring Boot", taken -> true))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Spring Boot");
    }
}
