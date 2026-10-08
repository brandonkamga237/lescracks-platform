package com.brandonkamga.lescracks.cracklab.domain;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class LevelTest {

    @Test
    @DisplayName("XP thresholds decide the level, and the top level has no next one")
    void levelFollowsXp() {
        assertThat(Level.of(0).name()).isEqualTo("Recrue");
        assertThat(Level.of(99).name()).isEqualTo("Recrue");
        assertThat(Level.of(100).name()).isEqualTo("Apprenti");
        assertThat(Level.of(2999).name()).isEqualTo("Principal");
        assertThat(Level.of(3000).name()).isEqualTo("Crack");
        assertThat(Level.of(3000).next()).isNull();
        assertThat(Level.of(150).next().name()).isEqualTo("Ingénieur");
    }
}
