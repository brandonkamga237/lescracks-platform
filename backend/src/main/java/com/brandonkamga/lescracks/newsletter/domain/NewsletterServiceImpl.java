package com.brandonkamga.lescracks.newsletter.domain;

import com.brandonkamga.lescracks.event.domain.Event;
import com.brandonkamga.lescracks.account.application.AccountSummary;
import com.brandonkamga.lescracks.account.application.AccountDirectory;
import com.brandonkamga.lescracks.mail.domain.EventAnnouncement;
import com.brandonkamga.lescracks.mail.domain.Mailer;
import com.brandonkamga.lescracks.mail.domain.NewsletterConfirmation;
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
import java.util.Map;

@Service
@Transactional
public class NewsletterServiceImpl implements NewsletterService {
    private final AccountDirectory users;
    private final NewsletterSubscriptionRepository subscriptions;
    private final NewsletterCampaignRepository campaigns;
    private final Mailer mail;

    public NewsletterServiceImpl(AccountDirectory users, NewsletterSubscriptionRepository subscriptions,
                                 NewsletterCampaignRepository campaigns, Mailer mail) {
        this.users = users;
        this.subscriptions = subscriptions;
        this.campaigns = campaigns;
        this.mail = mail;
    }

    @Override
    @Transactional(readOnly = true)
    public NewsletterSubscription status(String username) {
        AccountSummary user = user(username);
        return subscriptions.findByUserId(user.getId())
                .orElseGet(() -> NewsletterSubscription.builder().userId(user.getId())
                    .status(NewsletterStatus.UNSUBSCRIBED)
                    .subscribedAt(null)
                    .build());
    }

    @Override
    public NewsletterSubscription subscribe(String username) {
        AccountSummary user = user(username);
        return subscribe(user);
    }

    @Override
    public NewsletterSubscription subscribePublic(String email, String firstName, String lastName) {
        String normalizedEmail = email.trim().toLowerCase();
        AccountSummary user = users.find(normalizedEmail).orElse(null);
        if (user != null && user.hasLoginMethod()) {
            throw new BadRequestException("Cette adresse email est déjà associée à un compte. Connecte-toi pour gérer ton abonnement.");
        }
        if (user == null) {
            user = users.createContact(normalizedEmail, firstName, lastName);
        }
        AccountSummary contact = user;
        NewsletterSubscription subscription = subscriptions.findByUserId(contact.getId())
                .orElseGet(() -> NewsletterSubscription.builder().userId(contact.getId()).build());
        if (subscription.getStatus() == NewsletterStatus.SUBSCRIBED && subscription.getId() != null) return subscription;
        subscription.setStatus(NewsletterStatus.PENDING);
        subscription.setUnsubscribedAt(null);
        subscription = subscriptions.save(subscription);
        mail.send(new NewsletterConfirmation(contact.getEmail(), subscription.getToken()));
        return subscription;
    }

    @Override
    public void confirm(String token) {
        NewsletterSubscription subscription = subscriptions.findByToken(token)
                .orElseThrow(() -> new NotFoundException("Ce lien de confirmation n’est plus valide."));
        if (subscription.getStatus() == NewsletterStatus.PENDING) subscription.setStatus(NewsletterStatus.SUBSCRIBED);
    }

    private NewsletterSubscription subscribe(AccountSummary user) {
        NewsletterSubscription subscription = subscriptions.findByUserId(user.getId())
                .orElseGet(() -> NewsletterSubscription.builder().userId(user.getId()).build());
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
        AccountSummary user = users.require(userId);
        NewsletterSubscription subscription = subscriptions.findByUserId(user.getId())
                .orElseGet(() -> NewsletterSubscription.builder().userId(user.getId()).build());
        subscription.setStatus(NewsletterStatus.UNSUBSCRIBED);
        subscription.setUnsubscribedAt(Instant.now());
        return subscriptions.save(subscription);
    }

    @Override
    public NewsletterSubscription subscribeById(Long userId) {
        AccountSummary user = users.require(userId);
        NewsletterSubscription subscription = subscriptions.findByUserId(user.getId())
                .orElseGet(() -> NewsletterSubscription.builder().userId(user.getId()).build());
        subscription.setStatus(NewsletterStatus.SUBSCRIBED);
        subscription.setUnsubscribedAt(null);
        return subscriptions.save(subscription);
    }

    @Override
    public void notifyEventSubscribers(Event event) {
        var active = subscriptions.findByStatus(NewsletterStatus.SUBSCRIBED);
        Map<Long, AccountSummary> people = people(active);
        active.stream().filter(subscription -> people.containsKey(subscription.getUserId()))
                .forEach(subscription -> mail.send(new EventAnnouncement(people.get(subscription.getUserId()).getEmail(),
                        event.getTitle(), event.getDescription(), "/evenements/" + slugOrId(event.getSlug(), event.getId()),
                        event.getCoverImage(), event.getStartDate(), subscription.getToken())));
    }

    @Override
    public void notifyResourceSubscribers(Resource resource) {
        var active = subscriptions.findByStatus(NewsletterStatus.SUBSCRIBED);
        Map<Long, AccountSummary> people = people(active);
        active.stream().filter(subscription -> people.containsKey(subscription.getUserId()))
                .forEach(subscription -> mail.send(new ResourceAnnouncement(people.get(subscription.getUserId()).getEmail(),
                        resource.getTitle(), resource.getDescription(), "/ressources/" + slugOrId(resource.getSlug(), resource.getId()),
                        resource.getCoverImage(), subscription.getToken())));
    }

    /** The exact email a subscriber would get, filled with a sample reader. */
    @Override
    public String preview(String subject, JsonNode body) {
        return mail.previewHtml(new NewsletterIssue("marie@example.com", subject, body, "Marie", "Kamga", null));
    }

    @Override
    public void sendTest(String subject, JsonNode body, String email) {
        mail.send(new NewsletterIssue(email.trim(), "[Test] " + subject, body, "Marie", "Kamga", null));
    }

    @Override
    public int broadcast(String subject, JsonNode body) {
        var active = subscriptions.findByStatus(NewsletterStatus.SUBSCRIBED);
        Map<Long, AccountSummary> people = people(active);
        active.forEach(subscription -> {
            AccountSummary user = people.get(subscription.getUserId());
            if (user == null) return;
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

    private Map<Long, AccountSummary> people(List<NewsletterSubscription> subscriptions) {
        return users.findAll(subscriptions.stream().map(NewsletterSubscription::getUserId).toList());
    }

    private AccountSummary user(String username) {
        return users.require(username);
    }
}
