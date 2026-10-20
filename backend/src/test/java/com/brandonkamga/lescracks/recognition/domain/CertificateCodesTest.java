package com.brandonkamga.lescracks.recognition.domain;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.HashSet;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

class CertificateCodesTest {

    @Test
    @DisplayName("codes are ten characters, never one that reads like another, and do not repeat")
    void readableAndUnique() {
        Set<String> seen = new HashSet<>();
        for (int i = 0; i < 2000; i++) {
            String code = CertificateCodes.next();
            assertThat(code).hasSize(10).matches("[A-HJKMNP-Z2-9]+");
            seen.add(code);
        }
        assertThat(seen).hasSize(2000);
    }
}
