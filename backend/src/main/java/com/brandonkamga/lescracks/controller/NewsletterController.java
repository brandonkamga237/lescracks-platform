package com.brandonkamga.lescracks.controller;

import com.brandonkamga.lescracks.domain.NewsletterCampaign;
import com.brandonkamga.lescracks.domain.NewsletterStatus;
import com.brandonkamga.lescracks.domain.NewsletterSubscription;
import com.brandonkamga.lescracks.domain.User;
import com.brandonkamga.lescracks.dto.newsletter.AdminSubscriberResponse;
import com.brandonkamga.lescracks.dto.newsletter.BroadcastRequest;
import com.brandonkamga.lescracks.dto.newsletter.NewsletterCampaignResponse;
import com.brandonkamga.lescracks.dto.newsletter.NewsletterResponse;
import com.brandonkamga.lescracks.repository.NewsletterSubscriptionRepository;
import com.brandonkamga.lescracks.service.interfaces.NewsletterService;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;

import java.nio.charset.StandardCharsets;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;

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

    @GetMapping("/admin/campaigns")
    @PreAuthorize("hasRole('ADMIN')")
    public List<NewsletterCampaignResponse> campaigns() {
        return newsletter.campaigns().stream()
                .map(c -> new NewsletterCampaignResponse(c.getId(), c.getSubject(), c.getMessage(),
                        c.getRecipientCount(), c.getSentAt()))
                .toList();
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
    public List<AdminSubscriberResponse> listSubscriptions(@RequestParam(required = false) NewsletterStatus status) {
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

    @GetMapping(value = "/admin/subscriptions/export", produces = "text/csv")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<StreamingResponseBody> exportSubscriptions() {
        List<NewsletterSubscription> list = subscriptions.findAll();
        StreamingResponseBody body = out -> {
            out.write("email;firstName;lastName;status;subscribedAt;unsubscribedAt\n".getBytes(StandardCharsets.UTF_8));
            for (NewsletterSubscription s : list) {
                User user = s.getUser();
                String row = csvLine(user.getEmail(), user.getFirstName(), user.getLastName(),
                        s.getStatus().name(),
                        s.getSubscribedAt() == null ? "" : formatter.format(s.getSubscribedAt()),
                        s.getUnsubscribedAt() == null ? "" : formatter.format(s.getUnsubscribedAt()));
                out.write((row + "\n").getBytes(StandardCharsets.UTF_8));
            }
        };
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=lescracks-newsletter.csv")
                .body(body);
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

    private static final DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")
            .withZone(ZoneId.of("UTC"));

    private String csvLine(Object... values) {
        StringBuilder line = new StringBuilder();
        for (int i = 0; i < values.length; i++) {
            if (i > 0) line.append(';');
            String value = String.valueOf(values[i]);
            if (value.contains(";") || value.contains("\"") || value.contains("\n")) {
                line.append('"').append(value.replace("\"", "\"\"")).append('"');
            } else {
                line.append(value);
            }
        }
        return line.toString();
    }
}
