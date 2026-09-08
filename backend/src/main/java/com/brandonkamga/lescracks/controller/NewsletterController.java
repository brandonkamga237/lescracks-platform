package com.brandonkamga.lescracks.controller;

import com.brandonkamga.lescracks.domain.NewsletterSubscription;
import com.brandonkamga.lescracks.domain.User;
import com.brandonkamga.lescracks.dto.newsletter.NewsletterResponse;
import com.brandonkamga.lescracks.dto.newsletter.BroadcastRequest;
import com.brandonkamga.lescracks.dto.newsletter.AdminSubscriberResponse;
import com.brandonkamga.lescracks.domain.NewsletterStatus;
import com.brandonkamga.lescracks.repository.NewsletterSubscriptionRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import java.util.List;
import com.brandonkamga.lescracks.service.interfaces.NewsletterService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/newsletter")
public class NewsletterController {
    private final NewsletterService newsletter;
    private final NewsletterSubscriptionRepository subscriptions;

    public NewsletterController(NewsletterService newsletter, NewsletterSubscriptionRepository subscriptions) {
        this.newsletter = newsletter;
        this.subscriptions = subscriptions;
    }

    @GetMapping
    public NewsletterResponse status(Authentication authentication) {
        return response(newsletter.status(authentication.getName()));
    }

    @PostMapping("/subscribe")
    public NewsletterResponse subscribe(Authentication authentication) {
        return response(newsletter.subscribe(authentication.getName()));
    }

    @DeleteMapping("/unsubscribe")
    public ResponseEntity<Void> unsubscribe(Authentication authentication) {
        newsletter.unsubscribe(authentication.getName());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/admin/broadcast")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Integer> broadcast(@Valid @RequestBody BroadcastRequest request) {
        return ResponseEntity.status(HttpStatus.ACCEPTED)
                .body(newsletter.broadcast(request.subject().trim(), request.message().trim()));
    }

        @GetMapping("/admin/subscribers")
        @PreAuthorize("hasRole('ADMIN')")
        public List<AdminSubscriberResponse> subscribers() {
        return subscriptions.findByStatus(NewsletterStatus.SUBSCRIBED).stream()
            .map(subscription -> new AdminSubscriberResponse(subscription.getUser().getId(),
                subscription.getUser().getEmail(), subscription.getUser().getFirstName(),
                subscription.getUser().getLastName(), subscription.getStatus(),
                subscription.getSubscribedAt(), subscription.getUnsubscribedAt()))
            .toList();
        }

        @GetMapping("/admin/subscriptions")
        @PreAuthorize("hasRole('ADMIN')")
        public List<AdminSubscriberResponse> subscriptions(@RequestParam(required = false) NewsletterStatus status) {
            List<NewsletterSubscription> list = status == null ? subscriptions.findAll() : subscriptions.findByStatus(status);
            return list.stream().map(this::toAdminResponse).toList();
        }

        @PostMapping("/admin/subscriptions/{userId}/unsubscribe")
        @PreAuthorize("hasRole('ADMIN')")
        public ResponseEntity<AdminSubscriberResponse> unsubscribeById(@PathVariable Long userId) {
            return ResponseEntity.ok(toAdminResponse(newsletter.unsubscribeById(userId)));
        }

        @PostMapping("/admin/subscriptions/{userId}/subscribe")
        @PreAuthorize("hasRole('ADMIN')")
        public ResponseEntity<AdminSubscriberResponse> subscribeById(@PathVariable Long userId) {
            return ResponseEntity.ok(toAdminResponse(newsletter.subscribeById(userId)));
        }

        @GetMapping("/admin/stats")
        @PreAuthorize("hasRole('ADMIN')")
        public NewsletterStats stats() {
        return new NewsletterStats(
            subscriptions.countByStatus(NewsletterStatus.SUBSCRIBED),
            subscriptions.countByStatus(NewsletterStatus.UNSUBSCRIBED));
        }

        public record NewsletterStats(long subscribed, long unsubscribed) { }

    private AdminSubscriberResponse toAdminResponse(NewsletterSubscription subscription) {
        User user = subscription.getUser();
        return new AdminSubscriberResponse(user.getId(), user.getEmail(), user.getFirstName(),
                user.getLastName(), subscription.getStatus(), subscription.getSubscribedAt(),
                subscription.getUnsubscribedAt());
    }

    private NewsletterResponse response(NewsletterSubscription subscription) {
        return new NewsletterResponse(subscription.getStatus(), subscription.getSubscribedAt(),
                subscription.getUnsubscribedAt());
    }
}