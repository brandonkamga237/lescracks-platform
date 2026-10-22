package com.brandonkamga.lescracks.shared.util;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class VisitorKeysTest {

    @Test
    @DisplayName("a member is the same visitor whatever the case of the email, and the key never holds the address")
    void memberKeyIsAStableHash() {
        String key = VisitorKeys.member("Awa@Exemple.com");

        assertThat(key).isEqualTo(VisitorKeys.member(" awa@exemple.com "));
        assertThat(key).startsWith("m:").doesNotContain("awa").hasSizeLessThanOrEqualTo(80);
    }

    @Test
    @DisplayName("an anonymous key fits the column")
    void anonymousKeyFitsTheColumn() {
        assertThat(VisitorKeys.anonymous(UUID.randomUUID())).startsWith("a:").hasSizeLessThanOrEqualTo(80);
    }
}
