package com.brandonkamga.lescracks.newsletter.domain;

import com.brandonkamga.lescracks.identity.domain.User;
import com.brandonkamga.lescracks.identity.domain.UserDirectory;
import com.brandonkamga.lescracks.mail.domain.Mailer;
import com.brandonkamga.lescracks.newsletter.infra.NewsletterCampaignRepository;
import com.brandonkamga.lescracks.newsletter.infra.NewsletterSubscriptionRepository;
import com.brandonkamga.lescracks.shared.exception.BadRequestException;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class NewsletterServiceTest {

    @Mock private UserDirectory users;
    @Mock private NewsletterSubscriptionRepository subscriptions;
    @Mock private NewsletterCampaignRepository campaigns;
    @Mock private Mailer mail;

    private NewsletterServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new NewsletterServiceImpl(users, subscriptions, campaigns, mail);
    }

    @Test
    @DisplayName("an unknown address is recorded as a contact and subscribed")
    void subscribesAContact() {
        User contact = User.builder().id(4L).email("awa@example.com").build();
        when(users.find("awa@example.com")).thenReturn(Optional.empty());
        when(users.createContact("awa@example.com", "Awa", null)).thenReturn(contact);
        when(subscriptions.findByUserId(4L)).thenReturn(Optional.empty());
        when(subscriptions.save(any(NewsletterSubscription.class))).thenAnswer(invocation -> invocation.getArgument(0));

        NewsletterSubscription subscription = service.subscribePublic(" Awa@Example.com ", "Awa", null);

        assertThat(subscription.getUser()).isSameAs(contact);
        assertThat(subscription.getStatus()).isEqualTo(NewsletterStatus.SUBSCRIBED);
    }

    @Test
    @DisplayName("an address that has an account must sign in to manage its subscription")
    void refusesAnAccount() {
        when(users.find("awa@example.com"))
                .thenReturn(Optional.of(User.builder().email("awa@example.com").passwordHash("hash").build()));

        assertThatThrownBy(() -> service.subscribePublic("awa@example.com", null, null))
                .isInstanceOf(BadRequestException.class);
        verify(users, never()).createContact(anyString(), any(), any());
    }
}
