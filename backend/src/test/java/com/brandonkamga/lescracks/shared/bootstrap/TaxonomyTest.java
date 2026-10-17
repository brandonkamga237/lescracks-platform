package com.brandonkamga.lescracks.shared.bootstrap;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.HashSet;
import java.util.Locale;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

// The seeders run at every startup in production: a theme that breaks a column limit or a
// unique constraint would stop the application from booting.
class TaxonomyTest {

    @Test
    @DisplayName("theme names and slugs fit their columns and are unique")
    void themesAreValid() {
        Set<String> names = new HashSet<>();
        Set<String> slugs = new HashSet<>();
        Taxonomy.THEMES.forEach(theme -> {
            assertThat(theme.name()).isNotBlank().hasSizeLessThanOrEqualTo(80);
            assertThat(theme.slug()).matches("[a-z0-9-]+").hasSizeLessThanOrEqualTo(100);
            assertThat(theme.description()).isNotBlank();
            assertThat(names.add(theme.name().toLowerCase(Locale.ROOT))).as("duplicate theme %s", theme.name()).isTrue();
            assertThat(slugs.add(theme.slug())).as("duplicate slug %s", theme.slug()).isTrue();
        });
        assertThat(Taxonomy.THEMES).hasSize(9);
    }
}
