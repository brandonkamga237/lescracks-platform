package com.brandonkamga.lescracks.identity.domain;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class OneTimeTokensTest {

    private final OneTimeTokens tokens = new OneTimeTokens();

    @Test
    @DisplayName("an issued token is stored as a hash that only its raw value reproduces")
    void storesOnlyTheHash() {
        OneTimeTokens.Issued issued = tokens.issue();

        assertThat(issued.hash()).isNotEqualTo(issued.raw()).isEqualTo(tokens.hash(issued.raw()));
        assertThat(tokens.issue().raw()).isNotEqualTo(issued.raw());
    }
}
