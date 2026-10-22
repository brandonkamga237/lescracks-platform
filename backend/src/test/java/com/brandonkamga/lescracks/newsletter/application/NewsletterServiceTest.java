package com.brandonkamga.lescracks.newsletter.application;

import com.brandonkamga.lescracks.account.application.AccountDirectoryImpl;
import com.brandonkamga.lescracks.account.application.InMemoryAccountStore;
import com.brandonkamga.lescracks.account.domain.model.Account;
import com.brandonkamga.lescracks.newsletter.domain.model.Subscriber;
import com.brandonkamga.lescracks.newsletter.domain.model.SubscriptionStatus;
import com.brandonkamga.lescracks.mail.domain.Mailer;
import com.brandonkamga.lescracks.mail.domain.NewsletterConfirmation;
import com.brandonkamga.lescracks.shared.exception.BadRequestException;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class NewsletterServiceTest {

    private final InMemorySubscriberStore subscribers = new InMemorySubscriberStore();
    private final InMemoryAccountStore accounts = new InMemoryAccountStore();
    @Mock private Mailer mail;

    private NewsletterServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new NewsletterServiceImpl(subscribers, new AccountDirectoryImpl(accounts), mail);
    }

    @Test
    @DisplayName("a visitor's address waits for confirmation and gets the confirmation email; the link subscribes it")
    void publicSignUp() {
        Subscriber pending = service.subscribePublic(" Awa@Example.com ", "Awa", null);

        assertThat(subscribers.stored("awa@example.com").getStatus()).isEqualTo(SubscriptionStatus.PENDING);
        assertThat(subscribers.stored("awa@example.com").getAccountId()).isNull();
        verify(mail).send(new NewsletterConfirmation("awa@example.com", pending.getToken()));

        service.confirm(pending.getToken());
        assertThat(subscribers.stored("awa@example.com").isSubscribed()).isTrue();
    }

    @Test
    @DisplayName("an address with an account is sent to sign in instead")
    void accountsSignIn() {
        accounts.save(Account.builder().email("eric@example.com").passwordHash("h").build());

        assertThatThrownBy(() -> service.subscribePublic("eric@example.com", null, null)).isInstanceOf(BadRequestException.class);
        verify(mail, never()).send(any());
    }

    @Test
    @DisplayName("the confirmation link cannot resubscribe someone who left; the unsubscribe link works twice")
    void links() {
        Subscriber pending = service.subscribePublic("awa@example.com", "Awa", null);
        service.unsubscribeByToken(pending.getToken());
        service.unsubscribeByToken(pending.getToken());

        service.confirm(pending.getToken());

        assertThat(subscribers.stored("awa@example.com").getStatus()).isEqualTo(SubscriptionStatus.UNSUBSCRIBED);
    }

    @Test
    @DisplayName("signing up links the address already on the list to the new account, and subscribes it when asked")
    void attachesAnAccount() {
        service.subscribePublic("awa@example.com", "Awa", null);

        service.attachAccount(9L, "awa@example.com", "Awa", "Diallo", true);
        service.attachAccount(10L, "kofi@example.com", "Kofi", "M", false);

        assertThat(subscribers.stored("awa@example.com").getAccountId()).isEqualTo(9L);
        assertThat(subscribers.stored("awa@example.com").isSubscribed()).isTrue();
        assertThat(subscribers.findByEmail("kofi@example.com")).isEmpty();
    }

    @Test
    @DisplayName("a member subscribes and unsubscribes from their profile; one who never did reads as unsubscribed")
    void member() {
        Long id = accounts.save(Account.builder().email("lina@example.com").firstName("Lina").passwordHash("h").build()).getId();
        assertThat(service.view("lina@example.com").getStatus()).isEqualTo(SubscriptionStatus.UNSUBSCRIBED);

        service.subscribe("lina@example.com");
        assertThat(subscribers.stored("lina@example.com").getAccountId()).isEqualTo(id);
        assertThat(subscribers.stored("lina@example.com").isSubscribed()).isTrue();

        service.unsubscribe("lina@example.com");
        assertThat(subscribers.stored("lina@example.com").getUnsubscribedAt()).isNotNull();
    }
}
