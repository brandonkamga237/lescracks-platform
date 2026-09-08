package com.brandonkamga.lescracks.service.impl;

import com.brandonkamga.lescracks.domain.NewsletterStatus;
import com.brandonkamga.lescracks.domain.NewsletterSubscription;
import com.brandonkamga.lescracks.domain.Event;
import com.brandonkamga.lescracks.domain.Resource;
import com.brandonkamga.lescracks.domain.User;
import com.brandonkamga.lescracks.exception.NotFoundException;
import com.brandonkamga.lescracks.repository.NewsletterSubscriptionRepository;
import com.brandonkamga.lescracks.repository.UserRepository;
import com.brandonkamga.lescracks.service.interfaces.NewsletterService;
import com.brandonkamga.lescracks.service.interfaces.MailService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
@Transactional
public class NewsletterServiceImpl implements NewsletterService {
    private final UserRepository users;
    private final NewsletterSubscriptionRepository subscriptions;
    private final MailService mail;

    public NewsletterServiceImpl(UserRepository users, NewsletterSubscriptionRepository subscriptions,
                                 MailService mail) {
        this.users = users;
        this.subscriptions = subscriptions;
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
    public NewsletterSubscription unsubscribeById(Long userId) {
        User user = users.findById(userId)
                .orElseThrow(() -> new NotFoundException("Utilisateur", "id", userId));
        NewsletterSubscription subscription = subscriptions.findByUserId(user.getId())
                .orElseGet(() -> NewsletterSubscription.builder().user(user).build());
        subscription.setStatus(NewsletterStatus.UNSUBSCRIBED);
        subscription.setUnsubscribedAt(Instant.now());
        return subscriptions.save(subscription);
    }

    @Override
    public NewsletterSubscription subscribeById(Long userId) {
        User user = users.findById(userId)
                .orElseThrow(() -> new NotFoundException("Utilisateur", "id", userId));
        NewsletterSubscription subscription = subscriptions.findByUserId(user.getId())
                .orElseGet(() -> NewsletterSubscription.builder().user(user).build());
        subscription.setStatus(NewsletterStatus.SUBSCRIBED);
        subscription.setUnsubscribedAt(null);
        return subscriptions.save(subscription);
    }

    @Override
    public void notifyEventSubscribers(Event event) {
        subscriptions.findByStatus(NewsletterStatus.SUBSCRIBED)
                .forEach(subscription -> mail.sendEventNotification(subscription.getUser().getEmail(), event));
    }

    @Override
    public void notifyResourceSubscribers(Resource resource) {
        subscriptions.findByStatus(NewsletterStatus.SUBSCRIBED)
                .forEach(subscription -> mail.sendResourceNotification(subscription.getUser().getEmail(), resource));
    }

    @Override
    public int broadcast(String subject, String message) {
        var active = subscriptions.findByStatus(NewsletterStatus.SUBSCRIBED);
        active.forEach(subscription -> {
            User user = subscription.getUser();
            mail.sendBroadcast(user.getEmail(), subject, message, user.getFirstName(), user.getLastName());
        });
        return active.size();
    }

    private User user(String username) {
        return users.findByEmailIgnoreCase(username)
                .orElseThrow(() -> new NotFoundException("Utilisateur", "email", username));
    }
}