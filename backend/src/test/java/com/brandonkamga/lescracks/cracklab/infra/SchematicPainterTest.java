package com.brandonkamga.lescracks.cracklab.infra;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class SchematicPainterTest {

    @Test
    @DisplayName("the seed hashes to the browser's number, so a preview shows the diagram the page shows")
    void hashMatchesTheFrontend() {
        // Values computed by the frontend's Schematic hash (FNV-1a, Math.imul, >>> 0).
        assertThat(SchematicPainter.hash("url-shortener")).isEqualTo(2385756433L);
        assertThat(SchematicPainter.hash("rate-limiter")).isEqualTo(2386835166L);
        assertThat(SchematicPainter.hash("sécurité-api")).isEqualTo(1661703018L);
    }
}
