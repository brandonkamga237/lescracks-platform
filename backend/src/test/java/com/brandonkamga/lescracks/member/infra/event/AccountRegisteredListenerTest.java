package com.brandonkamga.lescracks.member.infra.event;

import com.brandonkamga.lescracks.account.domain.model.AccountRegistered;
import com.brandonkamga.lescracks.member.application.ProfileService;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

class AccountRegisteredListenerTest {

    private final ProfileService profiles = mock(ProfileService.class);
    private final AccountRegisteredListener listener = new AccountRegisteredListener(profiles);

    @Test
    @DisplayName("a sign-up with a phone or a consent fills the profile; one without leaves it empty")
    void keepsOnlyWhatWasAnswered() {
        listener.keepSignUpAnswers(new AccountRegistered(1L, "a@example.com", "+237677123456", null, false));
        verify(profiles).recordSignUp(1L, "+237677123456", null);

        listener.keepSignUpAnswers(new AccountRegistered(2L, "b@example.com", " ", null, false));
        verify(profiles, never()).recordSignUp(eq(2L), any(), any());
    }
}
