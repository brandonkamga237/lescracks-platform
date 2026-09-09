package com.brandonkamga.lescracks.service.impl;

import com.brandonkamga.lescracks.domain.AuthProvider;
import com.brandonkamga.lescracks.domain.NewsletterCampaign;
import com.brandonkamga.lescracks.domain.NewsletterStatus;
import com.brandonkamga.lescracks.domain.NewsletterSubscription;
import com.brandonkamga.lescracks.domain.Event;
import com.brandonkamga.lescracks.domain.Resource;
import com.brandonkamga.lescracks.domain.User;
import com.brandonkamga.lescracks.domain.UserStatus;
import com.brandonkamga.lescracks.exception.BadRequestException;
import com.brandonkamga.lescracks.exception.NotFoundException;
import com.brandonkamga.lescracks.repository.NewsletterCampaignRepository;
import com.brandonkamga.lescracks.repository.NewsletterSubscriptionRepository;
import com.brandonkamga.lescracks.repository.UserRepository;
import com.brandonkamga.lescracks.service.interfaces.NewsletterService;
import com.brandonkamga.lescracks.service.interfaces.MailService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
@Transactional
public class NewsletterServiceImpl implements NewsletterService {
    private final UserRepository users;
    private final NewsletterSubscriptionRepository subscriptions;
    private final NewsletterCampaignRepository campaigns;
    private final MailService mail;

    public NewsletterServiceImpl(UserRepository users, NewsletterSubscriptionRepository subscriptions,
                                 NewsletterCampaignRepository campaigns, MailService mail) {
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
        User user = users.findByEmailIgnoreCase(normalizedEmail).orElse(null);
        if (user != null && (user.getPasswordHash() != null || user.getProvider() != AuthProvider.LOCAL)) {
            throw new BadRequestException("Cette adresse email est déjà associée à un compte. Connecte-toi pour gérer ton abonnement.");
        }
        if (user == null) {
            user = users.save(User.builder()
                    .email(normalizedEmail)
                    .firstName(firstName == null ? "" : firstName.trim())
                    .lastName(lastName == null ? "" : lastName.trim())
                    .passwordHash(null)
                    .status(UserStatus.ACTIVE)
                    .emailVerified(false)
                    .provider(AuthProvider.LOCAL)
                    .build());
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
        campaigns.save(NewsletterCampaign.builder()
                .subject(subject)
                .message(message)
                .recipientCount(active.size())
                .build());
        return active.size();
    }

    @Override
    @Transactional(readOnly = true)
    public List<NewsletterCampaign> campaigns() {
        return campaigns.findAllByOrderBySentAtDesc();
    }

    private User user(String username) {
        return users.findByEmailIgnoreCase(username)
                .orElseThrow(() -> new NotFoundException("Utilisateur", "email", username));
    }
}
