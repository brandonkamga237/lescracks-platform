package com.brandonkamga.lescracks.newsletter.api;

import com.brandonkamga.lescracks.newsletter.api.dto.NewsletterPublicSubscribeRequest;
import com.brandonkamga.lescracks.newsletter.api.dto.NewsletterResponse;
import com.brandonkamga.lescracks.newsletter.application.NewsletterService;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

/** A member's own subscription, and the public form, confirmation and one-click unsubscribe links. */
@RestController
@RequestMapping("/api/newsletter")
public class NewsletterController {
    private final NewsletterService newsletter;

    public NewsletterController(NewsletterService newsletter) {
        this.newsletter = newsletter;
    }

    @GetMapping
    public NewsletterResponse status(Authentication authentication) {
        return NewsletterResponse.of(newsletter.view(authentication.getName()));
    }

    @PostMapping("/subscribe")
    public NewsletterResponse subscribe(Authentication authentication) {
        return NewsletterResponse.of(newsletter.subscribe(authentication.getName()));
    }

    @PostMapping("/public/subscribe")
    public NewsletterResponse subscribePublic(@Valid @RequestBody NewsletterPublicSubscribeRequest request) {
        return NewsletterResponse.of(newsletter.subscribePublic(request.email(), request.firstName(), request.lastName()));
    }

    @DeleteMapping("/unsubscribe")
    public ResponseEntity<Void> unsubscribe(Authentication authentication) {
        newsletter.unsubscribe(authentication.getName());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/public/confirm")
    public ResponseEntity<Void> confirm(@RequestParam String token) {
        newsletter.confirm(token);
        return ResponseEntity.noContent().build();
    }

    /**
     * The link of every newsletter email, and the one-click POST mail clients send for the
     * List-Unsubscribe header (RFC 8058): the token alone identifies the subscription.
     */
    @PostMapping("/public/unsubscribe")
    public ResponseEntity<Void> unsubscribeByToken(@RequestParam String token) {
        newsletter.unsubscribeByToken(token);
        return ResponseEntity.noContent().build();
    }
}
