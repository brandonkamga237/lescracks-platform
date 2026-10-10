package com.brandonkamga.lescracks.shared.bootstrap;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

// The seeders run at every startup in production: a catalogue that breaks a column limit or a
// unique constraint would stop the application from booting.
class TaxonomyTest {

    private final Map<String, List<String>> taxonomy = Taxonomy.data();

    @Test
    @DisplayName("category names fit categories.name and are unique ignoring case")
    void categoryNamesAreValid() {
        Set<String> seen = new HashSet<>();
        taxonomy.keySet().forEach(name -> {
            assertThat(name).isNotBlank().hasSizeLessThanOrEqualTo(80);
            assertThat(seen.add(name.toLowerCase(Locale.ROOT))).as("duplicate category %s", name).isTrue();
        });
    }

    @Test
    @DisplayName("tag names fit tags.name and are unique ignoring case within a category")
    void tagNamesAreValid() {
        taxonomy.forEach((category, tags) -> {
            assertThat(tags).as("tags of %s", category).isNotEmpty();
            Set<String> seen = new HashSet<>();
            tags.forEach(tag -> {
                assertThat(tag).isNotBlank().hasSizeLessThanOrEqualTo(60);
                assertThat(seen.add(tag.toLowerCase(Locale.ROOT))).as("duplicate tag %s in %s", tag, category).isTrue();
            });
        });
    }
}
