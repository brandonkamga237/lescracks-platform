package com.brandonkamga.lescracks.event.domain;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class EventVisitorTest {

    @Test
    @DisplayName("a member is the same visitor whatever the case of the email, and the key never holds the address")
    void memberKeyIsAStableHash() {
        var key = EventVisitor.member("Awa@Exemple.com").key();

        assertThat(key).isEqualTo(EventVisitor.member(" awa@exemple.com ").key());
        assertThat(key).startsWith("m:").doesNotContain("awa").hasSizeLessThanOrEqualTo(80);
    }

    @Test
    void anonymousKeyFitsTheColumn() {
        assertThat(EventVisitor.anonymous(UUID.randomUUID()).key()).startsWith("a:").hasSizeLessThanOrEqualTo(80);
    }
}
