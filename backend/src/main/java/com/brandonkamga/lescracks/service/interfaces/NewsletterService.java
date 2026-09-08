package com.brandonkamga.lescracks.service.interfaces;

import com.brandonkamga.lescracks.domain.NewsletterSubscription;
import com.brandonkamga.lescracks.domain.Event;
import com.brandonkamga.lescracks.domain.Resource;

public interface NewsletterService {
    NewsletterSubscription status(String username);
    NewsletterSubscription subscribe(String username);
    NewsletterSubscription unsubscribe(String username);
    NewsletterSubscription unsubscribeById(Long userId);
    NewsletterSubscription subscribeById(Long userId);
    void notifyEventSubscribers(Event event);
    void notifyResourceSubscribers(Resource resource);
    int broadcast(String subject, String message);
}