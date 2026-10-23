package com.brandonkamga.lescracks.account.domain.model;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class AccountTest {

    @Test
    @DisplayName("blank arrival details are not recorded, and a recorded one is never overwritten")
    void arrival() {
        Account account = Account.builder().build();
        account.recordArrival(" ", " fr ", null, " ");
        account.recordArrival("/blog", "en", "Africa/Douala", "WhatsApp");
        account.recordArrival("/talk", "en", "Africa/Douala", "LinkedIn");

        assertThat(account.getSignupPath()).isEqualTo("/blog");
        assertThat(account.getSignupLanguage()).isEqualTo("fr");
        assertThat(account.getSignupTimezone()).isEqualTo("Africa/Douala");
        assertThat(account.getSignupSource()).isEqualTo("WhatsApp");
    }
}
