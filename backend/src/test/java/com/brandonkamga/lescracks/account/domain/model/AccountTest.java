package com.brandonkamga.lescracks.account.domain.model;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class AccountTest {

    @Test
    @DisplayName("a newsletter contact has no login method; a password or a provider gives one")
    void loginMethods() {
        assertThat(Account.builder().build().hasLoginMethod()).isFalse();
        assertThat(Account.builder().passwordHash("hash").build().hasLoginMethod()).isTrue();
        assertThat(Account.builder().provider(AuthProvider.GOOGLE).build().hasLoginMethod()).isTrue();
    }

    @Test
    @DisplayName("blank arrival details are not recorded, and a recorded one is never overwritten")
    void arrival() {
        Account account = Account.builder().build();
        account.recordArrival(" ", " fr ", null);
        account.recordArrival("/blog", "en", "Africa/Douala");

        assertThat(account.getSignupPath()).isEqualTo("/blog");
        assertThat(account.getSignupLanguage()).isEqualTo("fr");
        assertThat(account.getSignupTimezone()).isEqualTo("Africa/Douala");
    }
}
