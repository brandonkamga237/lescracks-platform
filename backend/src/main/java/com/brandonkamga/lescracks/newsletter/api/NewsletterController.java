package com.brandonkamga.lescracks.newsletter.api;

import com.brandonkamga.lescracks.identity.domain.User;
import com.brandonkamga.lescracks.identity.domain.UserDirectory;
import com.brandonkamga.lescracks.newsletter.api.dto.AdminSubscriberResponse;
import com.brandonkamga.lescracks.newsletter.api.dto.BroadcastRequest;
import com.brandonkamga.lescracks.newsletter.api.dto.NewsletterCampaignResponse;
import com.brandonkamga.lescracks.newsletter.api.dto.NewsletterPreviewRequest;
import com.brandonkamga.lescracks.newsletter.api.dto.NewsletterPreviewResponse;
import com.brandonkamga.lescracks.newsletter.api.dto.NewsletterPublicSubscribeRequest;
import com.brandonkamga.lescracks.newsletter.api.dto.NewsletterResponse;
import com.brandonkamga.lescracks.newsletter.api.dto.NewsletterTestRequest;
import com.brandonkamga.lescracks.newsletter.domain.NewsletterService;
import com.brandonkamga.lescracks.newsletter.domain.NewsletterStatus;
import com.brandonkamga.lescracks.newsletter.domain.NewsletterSubscription;
import com.brandonkamga.lescracks.newsletter.infra.NewsletterSubscriptionRepository;

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
import java.util.Map;

@RestController
@RequestMapping("/api/newsletter")
public class NewsletterController {
    private final NewsletterService newsletter;
    private final NewsletterSubscriptionRepository subscriptions;
    private final UserDirectory people;

    public NewsletterController(NewsletterService newsletter, NewsletterSubscriptionRepository subscriptions,
                                UserDirectory people) {
        this.newsletter = newsletter;
        this.subscriptions = subscriptions;
        this.people = people;
    }

    @GetMapping
    public NewsletterResponse status(Authentication authentication) {
        return response(newsletter.status(authentication.getName()));
    }

    @PostMapping("/subscribe")
    public NewsletterResponse subscribe(Authentication authentication) {
        return response(newsletter.subscribe(authentication.getName()));
    }

    @PostMapping("/public/subscribe")
    public NewsletterResponse subscribePublic(@Valid @RequestBody NewsletterPublicSubscribeRequest request) {
        return response(newsletter.subscribePublic(request.email(), request.firstName(), request.lastName()));
    }

    @DeleteMapping("/unsubscribe")
    public ResponseEntity<Void> unsubscribe(Authentication authentication) {
        newsletter.unsubscribe(authentication.getName());
        return ResponseEntity.noContent().build();
    }

    /**
     * The link of every newsletter email, and the one-click POST mail clients send for the
     * List-Unsubscribe header (RFC 8058): the token alone identifies the subscription.
     */
    @PostMapping("/public/confirm")
    public ResponseEntity<Void> confirm(@RequestParam String token) {
        newsletter.confirm(token);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/public/unsubscribe")
    public ResponseEntity<Void> unsubscribeByToken(@RequestParam String token) {
        newsletter.unsubscribeByToken(token);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/admin/broadcast")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Integer> broadcast(@Valid @RequestBody BroadcastRequest request) {
        return ResponseEntity.status(HttpStatus.ACCEPTED)
                .body(newsletter.broadcast(request.subject().trim(), request.body()));
    }

    @PostMapping("/admin/test")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> sendTest(@Valid @RequestBody NewsletterTestRequest request) {
        newsletter.sendTest(request.subject().trim(), request.body(), request.email());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/admin/preview")
    @PreAuthorize("hasRole('ADMIN')")
    public NewsletterPreviewResponse preview(@Valid @RequestBody NewsletterPreviewRequest request) {
        return new NewsletterPreviewResponse(newsletter.preview(request.subject(), request.body()));
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
        return toAdminResponses(subscriptions.findByStatus(NewsletterStatus.SUBSCRIBED));
    }

    @GetMapping("/admin/subscriptions")
    @PreAuthorize("hasRole('ADMIN')")
    public List<AdminSubscriberResponse> listSubscriptions(@RequestParam(required = false) NewsletterStatus status) {
        List<NewsletterSubscription> list = status == null ? subscriptions.findAll() : subscriptions.findByStatus(status);
        return toAdminResponses(list);
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
        Map<Long, User> users = people.findAll(list.stream().map(NewsletterSubscription::getUserId).toList());
        StreamingResponseBody body = out -> {
            out.write("email;firstName;lastName;status;subscribedAt;unsubscribedAt\n".getBytes(StandardCharsets.UTF_8));
            for (NewsletterSubscription s : list) {
                User user = users.get(s.getUserId());
                if (user == null) continue;
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
            subscriptions.countByStatus(NewsletterStatus.UNSUBSCRIBED),
            subscriptions.countByStatus(NewsletterStatus.PENDING));
    }

    /** {@code pending}: signed up from the public form, address not confirmed yet. */
    public record NewsletterStats(long subscribed, long unsubscribed, long pending) { }

    private List<AdminSubscriberResponse> toAdminResponses(List<NewsletterSubscription> list) {
        Map<Long, User> users = people.findAll(list.stream().map(NewsletterSubscription::getUserId).toList());
        return list.stream().filter(subscription -> users.containsKey(subscription.getUserId()))
                .map(subscription -> toAdminResponse(subscription, users.get(subscription.getUserId()))).toList();
    }

    private AdminSubscriberResponse toAdminResponse(NewsletterSubscription subscription) {
        return toAdminResponse(subscription, people.require(subscription.getUserId()));
    }

    private AdminSubscriberResponse toAdminResponse(NewsletterSubscription subscription, User user) {
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
