package com.brandonkamga.lescracks.newsletter.application;

import com.brandonkamga.lescracks.newsletter.domain.model.Campaign;
import com.brandonkamga.lescracks.newsletter.domain.model.Subscriber;
import com.brandonkamga.lescracks.newsletter.domain.port.CampaignStore;
import com.brandonkamga.lescracks.mail.domain.EventAnnouncement;
import com.brandonkamga.lescracks.mail.domain.Mailer;
import com.brandonkamga.lescracks.mail.domain.NewsletterIssue;

import com.fasterxml.jackson.databind.node.JsonNodeFactory;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

class NewsletterAdminServiceTest {

    private final InMemorySubscriberStore subscribers = new InMemorySubscriberStore();
    private final CampaignStore campaigns = mock(CampaignStore.class);
    private final Mailer mail = mock(Mailer.class);
    private final NewsletterAdminServiceImpl admin = new NewsletterAdminServiceImpl(subscribers, campaigns, mail);
    private final AnnouncementsImpl announcements = new AnnouncementsImpl(subscribers, mail);

    private Subscriber subscriber(String email, boolean subscribed) {
        Subscriber subscriber = Subscriber.of(email, "A", "B");
        if (subscribed) subscriber.subscribe();
        return subscribers.save(subscriber);
    }

    @Test
    @DisplayName("an issue goes to subscribers only and is recorded with its audience")
    void broadcast() {
        subscriber("a@example.com", true);
        subscriber("b@example.com", true);
        subscriber("pending@example.com", false);

        int sent = admin.broadcast("Octobre", JsonNodeFactory.instance.objectNode());

        assertThat(sent).isEqualTo(2);
        verify(mail, times(2)).send(any(NewsletterIssue.class));
        ArgumentCaptor<Campaign> recorded = ArgumentCaptor.forClass(Campaign.class);
        verify(campaigns).save(recorded.capture());
        assertThat(recorded.getValue().getRecipientCount()).isEqualTo(2);
    }

    @Test
    @DisplayName("the back office subscribes and unsubscribes by subscriber, account or not")
    void byId() {
        Subscriber visitor = subscriber("v@example.com", false);

        admin.subscribe(visitor.getId());
        assertThat(subscribers.stored("v@example.com").isSubscribed()).isTrue();

        admin.unsubscribe(visitor.getId());
        assertThat(subscribers.stored("v@example.com").isSubscribed()).isFalse();
    }

    @Test
    @DisplayName("an event announcement reaches every subscriber with their own unsubscribe token")
    void announces() {
        Subscriber a = subscriber("a@example.com", true);

        announcements.announceEvent(new EventNews("Hackathon", "Description", "/evenements/1", null, Instant.now()));

        verify(mail).send(argThat(email -> email instanceof EventAnnouncement news
                && news.to().equals("a@example.com") && news.unsubscribeToken().equals(a.getToken())));
    }
}
