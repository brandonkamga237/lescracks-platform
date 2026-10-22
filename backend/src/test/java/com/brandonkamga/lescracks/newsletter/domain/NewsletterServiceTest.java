package com.brandonkamga.lescracks.newsletter.domain;

import com.brandonkamga.lescracks.identity.domain.User;
import com.brandonkamga.lescracks.identity.domain.UserDirectory;
import com.brandonkamga.lescracks.mail.domain.Mailer;
import com.brandonkamga.lescracks.mail.domain.NewsletterConfirmation;
import com.brandonkamga.lescracks.mail.domain.NewsletterIssue;
import com.brandonkamga.lescracks.newsletter.infra.NewsletterCampaignRepository;
import com.brandonkamga.lescracks.newsletter.infra.NewsletterSubscriptionRepository;
import com.brandonkamga.lescracks.shared.exception.BadRequestException;
import com.brandonkamga.lescracks.shared.exception.NotFoundException;

import com.fasterxml.jackson.databind.ObjectMapper;
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
import static org.mockito.ArgumentMatchers.argThat;
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
    @DisplayName("an unknown address is recorded as a contact, waits for confirmation and gets the confirmation email")
    void subscribesAContact() {
        User contact = User.builder().id(4L).email("awa@example.com").build();
        when(users.find("awa@example.com")).thenReturn(Optional.empty());
        when(users.createContact("awa@example.com", "Awa", null)).thenReturn(contact);
        when(subscriptions.findByUserId(4L)).thenReturn(Optional.empty());
        when(subscriptions.save(any(NewsletterSubscription.class))).thenAnswer(invocation -> invocation.getArgument(0));

        NewsletterSubscription subscription = service.subscribePublic(" Awa@Example.com ", "Awa", null);

        assertThat(subscription.getUserId()).isEqualTo(4L);
        assertThat(subscription.getStatus()).isEqualTo(NewsletterStatus.PENDING);
        verify(mail).send(new NewsletterConfirmation("awa@example.com", subscription.getToken()));
    }

    @Test
    @DisplayName("the confirmation link starts the newsletter; it cannot resubscribe someone who left")
    void confirms() {
        NewsletterSubscription pending = NewsletterSubscription.builder().status(NewsletterStatus.PENDING).build();
        NewsletterSubscription left = NewsletterSubscription.builder().status(NewsletterStatus.UNSUBSCRIBED).build();
        when(subscriptions.findByToken(pending.getToken())).thenReturn(Optional.of(pending));
        when(subscriptions.findByToken(left.getToken())).thenReturn(Optional.of(left));

        service.confirm(pending.getToken());
        service.confirm(left.getToken());

        assertThat(pending.getStatus()).isEqualTo(NewsletterStatus.SUBSCRIBED);
        assertThat(left.getStatus()).isEqualTo(NewsletterStatus.UNSUBSCRIBED);
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

    @Test
    @DisplayName("the link in an email unsubscribes its subscription, and a second click changes nothing")
    void unsubscribesByToken() {
        NewsletterSubscription subscription = NewsletterSubscription.builder().status(NewsletterStatus.SUBSCRIBED).build();
        when(subscriptions.findByToken(subscription.getToken())).thenReturn(Optional.of(subscription));

        service.unsubscribeByToken(subscription.getToken());
        var first = subscription.getUnsubscribedAt();
        service.unsubscribeByToken(subscription.getToken());

        assertThat(subscription.getStatus()).isEqualTo(NewsletterStatus.UNSUBSCRIBED);
        assertThat(subscription.getUnsubscribedAt()).isNotNull().isEqualTo(first);
        assertThat(subscription.getToken()).hasSize(64);
    }

    @Test
    @DisplayName("an unknown link is refused")
    void unknownToken() {
        when(subscriptions.findByToken("nope")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.unsubscribeByToken("nope")).isInstanceOf(NotFoundException.class);
    }

    @Test
    @DisplayName("a test goes to one address, marked as a test, and is not recorded as a campaign")
    void sendsATest() throws Exception {
        service.sendTest("Nouveautés", new ObjectMapper().readTree("[]"), " admin@lescracks.com ");

        verify(mail).send(argThat(email -> email instanceof NewsletterIssue issue
                && issue.to().equals("admin@lescracks.com") && issue.subject().equals("[Test] Nouveautés")
                && issue.unsubscribeToken() == null));
        verify(campaigns, never()).save(any());
    }
}
