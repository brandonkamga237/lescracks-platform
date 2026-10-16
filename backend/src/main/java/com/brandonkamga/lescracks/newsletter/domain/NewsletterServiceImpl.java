package com.brandonkamga.lescracks.newsletter.domain;

import com.brandonkamga.lescracks.event.domain.Event;
import com.brandonkamga.lescracks.identity.domain.User;
import com.brandonkamga.lescracks.identity.domain.UserDirectory;
import com.brandonkamga.lescracks.mail.domain.EventAnnouncement;
import com.brandonkamga.lescracks.mail.domain.Mailer;
import com.brandonkamga.lescracks.mail.domain.NewsletterIssue;
import com.brandonkamga.lescracks.mail.domain.ResourceAnnouncement;
import com.brandonkamga.lescracks.newsletter.infra.NewsletterCampaignRepository;
import com.brandonkamga.lescracks.newsletter.infra.NewsletterSubscriptionRepository;
import com.brandonkamga.lescracks.resource.domain.Resource;
import com.brandonkamga.lescracks.shared.exception.BadRequestException;
import com.brandonkamga.lescracks.shared.exception.NotFoundException;

import com.fasterxml.jackson.databind.JsonNode;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
@Transactional
public class NewsletterServiceImpl implements NewsletterService {
    private final UserDirectory users;
    private final NewsletterSubscriptionRepository subscriptions;
    private final NewsletterCampaignRepository campaigns;
    private final Mailer mail;

    public NewsletterServiceImpl(UserDirectory users, NewsletterSubscriptionRepository subscriptions,
                                 NewsletterCampaignRepository campaigns, Mailer mail) {
        this.users = users;
        this.subscriptions = subscriptions;
        this.campaigns = campaigns;
        this.mail = mail;
    }

    @Override
    @Transactional(readOnly = true)
    public NewsletterSubscription status(String username) {
        User user = user(username);
        return subscriptions.findByUserId(user.getId())
                .orElseGet(() -> NewsletterSubscription.builder().user(user)
                    .status(NewsletterStatus.UNSUBSCRIBED)
                    .subscribedAt(null)
                    .build());
    }

    @Override
    public NewsletterSubscription subscribe(String username) {
        User user = user(username);
        return subscribe(user);
    }

    @Override
    public NewsletterSubscription subscribePublic(String email, String firstName, String lastName) {
        String normalizedEmail = email.trim().toLowerCase();
        User user = users.find(normalizedEmail).orElse(null);
        if (user != null && user.hasLoginMethod()) {
            throw new BadRequestException("Cette adresse email est déjà associée à un compte. Connecte-toi pour gérer ton abonnement.");
        }
        if (user == null) {
            user = users.createContact(normalizedEmail, firstName, lastName);
        }
        return subscribe(user);
    }

    private NewsletterSubscription subscribe(User user) {
        NewsletterSubscription subscription = subscriptions.findByUserId(user.getId())
                .orElseGet(() -> NewsletterSubscription.builder().user(user).build());
        subscription.setStatus(NewsletterStatus.SUBSCRIBED);
        subscription.setUnsubscribedAt(null);
        return subscriptions.save(subscription);
    }

    @Override
    public NewsletterSubscription unsubscribe(String username) {
        NewsletterSubscription subscription = subscriptions.findByUserId(user(username).getId())
                .orElseThrow(() -> new NotFoundException("Aucun abonnement newsletter trouvé."));
        subscription.setStatus(NewsletterStatus.UNSUBSCRIBED);
        subscription.setUnsubscribedAt(Instant.now());
        return subscription;
    }

    @Override
    public void unsubscribeByToken(String token) {
        NewsletterSubscription subscription = subscriptions.findByToken(token)
                .orElseThrow(() -> new NotFoundException("Ce lien de désabonnement n’est plus valide."));
        if (subscription.getStatus() == NewsletterStatus.UNSUBSCRIBED) return;
        subscription.setStatus(NewsletterStatus.UNSUBSCRIBED);
        subscription.setUnsubscribedAt(Instant.now());
    }

    @Override
    public NewsletterSubscription unsubscribeById(Long userId) {
        User user = users.require(userId);
        NewsletterSubscription subscription = subscriptions.findByUserId(user.getId())
                .orElseGet(() -> NewsletterSubscription.builder().user(user).build());
        subscription.setStatus(NewsletterStatus.UNSUBSCRIBED);
        subscription.setUnsubscribedAt(Instant.now());
        return subscriptions.save(subscription);
    }

    @Override
    public NewsletterSubscription subscribeById(Long userId) {
        User user = users.require(userId);
        NewsletterSubscription subscription = subscriptions.findByUserId(user.getId())
                .orElseGet(() -> NewsletterSubscription.builder().user(user).build());
        subscription.setStatus(NewsletterStatus.SUBSCRIBED);
        subscription.setUnsubscribedAt(null);
        return subscriptions.save(subscription);
    }

    @Override
    public void notifyEventSubscribers(Event event) {
        subscriptions.findByStatus(NewsletterStatus.SUBSCRIBED)
                .forEach(subscription -> mail.send(new EventAnnouncement(subscription.getUser().getEmail(),
                        event.getTitle(), event.getDescription(), "/evenements/" + slugOrId(event.getSlug(), event.getId()),
                        event.getCoverImage(), event.getStartDate(), subscription.getToken())));
    }

    @Override
    public void notifyResourceSubscribers(Resource resource) {
        subscriptions.findByStatus(NewsletterStatus.SUBSCRIBED)
                .forEach(subscription -> mail.send(new ResourceAnnouncement(subscription.getUser().getEmail(),
                        resource.getTitle(), resource.getDescription(), "/ressources/" + slugOrId(resource.getSlug(), resource.getId()),
                        resource.getCoverImage(), subscription.getToken())));
    }

    /** The exact email a subscriber would get, filled with a sample reader. */
    @Override
    public String preview(String subject, JsonNode body) {
        return mail.previewHtml(new NewsletterIssue("marie@example.com", subject, body, "Marie", "Kamga", null));
    }

    @Override
    public int broadcast(String subject, JsonNode body) {
        var active = subscriptions.findByStatus(NewsletterStatus.SUBSCRIBED);
        active.forEach(subscription -> {
            User user = subscription.getUser();
            mail.send(new NewsletterIssue(user.getEmail(), subject, body, user.getFirstName(), user.getLastName(),
                    subscription.getToken()));
        });
        campaigns.save(NewsletterCampaign.builder()
                .subject(subject)
                .message(body.toString())
                .recipientCount(active.size())
                .build());
        return active.size();
    }

    @Override
    @Transactional(readOnly = true)
    public List<NewsletterCampaign> campaigns() {
        return campaigns.findAllByOrderBySentAtDesc();
    }

    private static String slugOrId(String slug, Long id) {
        return slug != null ? slug : String.valueOf(id);
    }

    private User user(String username) {
        return users.require(username);
    }
}
