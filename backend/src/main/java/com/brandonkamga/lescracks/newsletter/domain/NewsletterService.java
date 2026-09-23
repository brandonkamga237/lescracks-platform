package com.brandonkamga.lescracks.newsletter.domain;

import com.brandonkamga.lescracks.event.domain.Event;
import com.brandonkamga.lescracks.resource.domain.Resource;

import java.util.List;

public interface NewsletterService {
    NewsletterSubscription status(String username);
    NewsletterSubscription subscribe(String username);
    NewsletterSubscription subscribePublic(String email, String firstName, String lastName);
    NewsletterSubscription unsubscribe(String username);
    NewsletterSubscription unsubscribeById(Long userId);
    NewsletterSubscription subscribeById(Long userId);
    void notifyEventSubscribers(Event event);
    void notifyResourceSubscribers(Resource resource);
    int broadcast(String subject, String message);
    List<NewsletterCampaign> campaigns();
}