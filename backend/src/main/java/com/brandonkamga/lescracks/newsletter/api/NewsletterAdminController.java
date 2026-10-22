package com.brandonkamga.lescracks.newsletter.api;

import com.brandonkamga.lescracks.newsletter.api.dto.AdminSubscriberResponse;
import com.brandonkamga.lescracks.newsletter.api.dto.BroadcastRequest;
import com.brandonkamga.lescracks.newsletter.api.dto.NewsletterCampaignResponse;
import com.brandonkamga.lescracks.newsletter.api.dto.NewsletterPreviewRequest;
import com.brandonkamga.lescracks.newsletter.api.dto.NewsletterPreviewResponse;
import com.brandonkamga.lescracks.newsletter.api.dto.NewsletterStatsResponse;
import com.brandonkamga.lescracks.newsletter.api.dto.NewsletterTestRequest;
import com.brandonkamga.lescracks.newsletter.application.NewsletterAdminService;
import com.brandonkamga.lescracks.newsletter.application.NewsletterStatistics;
import com.brandonkamga.lescracks.newsletter.domain.model.Subscriber;
import com.brandonkamga.lescracks.newsletter.domain.model.SubscriptionStatus;
import com.brandonkamga.lescracks.shared.util.Csv;

import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;

import java.nio.charset.StandardCharsets;
import java.util.List;

@RestController
@RequestMapping("/api/newsletter/admin")
@PreAuthorize("hasRole('ADMIN')")
public class NewsletterAdminController {
    private final NewsletterAdminService newsletter;
    private final NewsletterStatistics statistics;

    public NewsletterAdminController(NewsletterAdminService newsletter, NewsletterStatistics statistics) {
        this.newsletter = newsletter;
        this.statistics = statistics;
    }

    @PostMapping("/broadcast")
    public ResponseEntity<Integer> broadcast(@Valid @RequestBody BroadcastRequest request) {
        return ResponseEntity.status(HttpStatus.ACCEPTED).body(newsletter.broadcast(request.subject().trim(), request.body()));
    }

    @PostMapping("/test")
    public ResponseEntity<Void> sendTest(@Valid @RequestBody NewsletterTestRequest request) {
        newsletter.sendTest(request.subject().trim(), request.body(), request.email());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/preview")
    public NewsletterPreviewResponse preview(@Valid @RequestBody NewsletterPreviewRequest request) {
        return new NewsletterPreviewResponse(newsletter.preview(request.subject(), request.body()));
    }

    @GetMapping("/campaigns")
    public List<NewsletterCampaignResponse> campaigns() {
        return newsletter.listCampaigns().stream().map(NewsletterCampaignResponse::of).toList();
    }

    @GetMapping("/subscribers")
    public List<AdminSubscriberResponse> subscribers() {
        return newsletter.listSubscribers(SubscriptionStatus.SUBSCRIBED).stream().map(AdminSubscriberResponse::of).toList();
    }

    @GetMapping("/subscriptions")
    public List<AdminSubscriberResponse> subscriptions(@RequestParam(required = false) SubscriptionStatus status) {
        return newsletter.listSubscribers(status).stream().map(AdminSubscriberResponse::of).toList();
    }

    @PostMapping("/subscriptions/{id}/unsubscribe")
    public AdminSubscriberResponse unsubscribe(@PathVariable Long id) {
        return AdminSubscriberResponse.of(newsletter.unsubscribe(id));
    }

    @PostMapping("/subscriptions/{id}/subscribe")
    public AdminSubscriberResponse subscribe(@PathVariable Long id) {
        return AdminSubscriberResponse.of(newsletter.subscribe(id));
    }

    @GetMapping(value = "/subscriptions/export", produces = "text/csv")
    public ResponseEntity<StreamingResponseBody> export() {
        List<Subscriber> list = newsletter.listSubscribers(null);
        StreamingResponseBody body = out -> {
            out.write("email;firstName;lastName;status;subscribedAt;unsubscribedAt\n".getBytes(StandardCharsets.UTF_8));
            for (Subscriber s : list) {
                out.write(Csv.line(s.getEmail(), s.getFirstName(), s.getLastName(), s.getStatus().name(),
                        s.getSubscribedAt(), s.getUnsubscribedAt()).getBytes(StandardCharsets.UTF_8));
            }
        };
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=lescracks-newsletter.csv")
                .body(body);
    }

    @GetMapping("/stats")
    public NewsletterStatsResponse stats() {
        return new NewsletterStatsResponse(
                statistics.countByStatus(SubscriptionStatus.SUBSCRIBED),
                statistics.countByStatus(SubscriptionStatus.UNSUBSCRIBED),
                statistics.countByStatus(SubscriptionStatus.PENDING));
    }
}
