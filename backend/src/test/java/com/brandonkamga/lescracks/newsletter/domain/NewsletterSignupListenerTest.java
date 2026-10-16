package com.brandonkamga.lescracks.newsletter.domain;

import com.brandonkamga.lescracks.identity.domain.MemberRegistered;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

class NewsletterSignupListenerTest {

    private final NewsletterService newsletter = mock(NewsletterService.class);
    private final NewsletterSignupListener listener = new NewsletterSignupListener(newsletter);

    @Test
    @DisplayName("a member who ticked the box is subscribed, the others are not")
    void subscribesOnlyOnRequest() {
        listener.subscribeIfAsked(new MemberRegistered("awa@example.com", true));
        listener.subscribeIfAsked(new MemberRegistered("eric@example.com", false));

        verify(newsletter).subscribe("awa@example.com");
        verify(newsletter, never()).subscribe("eric@example.com");
        verify(newsletter, never()).subscribePublic(anyString(), anyString(), anyString());
    }
}
