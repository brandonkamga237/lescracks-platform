package com.brandonkamga.lescracks.newsletter.domain;

import com.brandonkamga.lescracks.event.domain.Event;
import com.brandonkamga.lescracks.resource.domain.Resource;

import com.fasterxml.jackson.databind.JsonNode;

import java.util.List;

public interface NewsletterService {
    NewsletterSubscription status(String username);
    NewsletterSubscription subscribe(String username);
    /** From the public form: the address must confirm before anything else is sent to it. */
    NewsletterSubscription subscribePublic(String email, String firstName, String lastName);

    /** The link of the confirmation email. */
    void confirm(String token);
    NewsletterSubscription unsubscribe(String username);

    /** From the link in a newsletter email; using it twice is harmless. */
    void unsubscribeByToken(String token);
    NewsletterSubscription unsubscribeById(Long userId);
    NewsletterSubscription subscribeById(Long userId);
    void notifyEventSubscribers(Event event);
    void notifyResourceSubscribers(Resource resource);
    int broadcast(String subject, JsonNode body);
    String preview(String subject, JsonNode body);

    /** The campaign as subscribers will get it, sent to one address and marked as a test; nothing is recorded. */
    void sendTest(String subject, JsonNode body, String email);
    List<NewsletterCampaign> campaigns();
}