package com.brandonkamga.lescracks.newsletter.domain;

import com.brandonkamga.lescracks.identity.domain.signup.MemberRegistered;

import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

@Component
public class NewsletterSignupListener {
    private final NewsletterService newsletter;

    public NewsletterSignupListener(NewsletterService newsletter) {
        this.newsletter = newsletter;
    }

    /** Runs in the sign-up transaction: the subscription exists exactly when the account does. */
    @EventListener
    public void subscribeIfAsked(MemberRegistered event) {
        if (event.wantsNewsletter()) newsletter.subscribe(event.email());
    }
}
