package com.brandonkamga.lescracks.identity.domain;

import com.brandonkamga.lescracks.shared.exception.BadRequestException;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class PhoneNumbersTest {

    @Test
    @DisplayName("a number typed with spaces is stored in international form, and gives its country")
    void normalisesAndFindsTheCountry() {
        assertThat(PhoneNumbers.parse("+237 6 77 12 34 56")).isEqualTo(new PhoneNumbers.Parsed("+237677123456", "CM"));
        assertThat(PhoneNumbers.parse("+225 07 07 12 34 56")).isEqualTo(new PhoneNumbers.Parsed("+2250707123456", "CI"));
        assertThat(PhoneNumbers.parse("+33 6 12 34 56 78").country()).isEqualTo("FR");
    }

    @Test
    @DisplayName("a number too short for its country, or without an indicator, is refused with a readable message")
    void refusesWhatCannotBeANumber() {
        assertThatThrownBy(() -> PhoneNumbers.parse("+237 6 77")).isInstanceOf(BadRequestException.class).hasMessageContaining("indicatif");
        assertThatThrownBy(() -> PhoneNumbers.parse("677123456")).isInstanceOf(BadRequestException.class);
        assertThatThrownBy(() -> PhoneNumbers.parse("bonjour")).isInstanceOf(BadRequestException.class);
    }
}
