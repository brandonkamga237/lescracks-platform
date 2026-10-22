package com.brandonkamga.lescracks.newsletter.infra.event;

import com.brandonkamga.lescracks.account.domain.model.AccountRegistered;
import com.brandonkamga.lescracks.newsletter.application.NewsletterService;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

class AccountRegisteredListenerTest {

    private final NewsletterService newsletter = mock(NewsletterService.class);
    private final AccountRegisteredListener listener = new AccountRegisteredListener(newsletter);

    @Test
    @DisplayName("every sign-up reaches the newsletter, with whether the member asked to subscribe")
    void attaches() {
        listener.attach(new AccountRegistered(1L, "awa@example.com", "Awa", "D", null, null, true));

        verify(newsletter).attachAccount(1L, "awa@example.com", "Awa", "D", true);
    }
}
