package com.brandonkamga.lescracks.newsletter.infra.event;

import com.brandonkamga.lescracks.account.domain.model.AccountRegistered;
import com.brandonkamga.lescracks.newsletter.application.NewsletterService;

import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

/** Runs in the sign-up transaction: the subscription exists exactly when the account does. */
@Component("newsletterAccountRegisteredListener")
public class AccountRegisteredListener {

    private final NewsletterService newsletter;

    public AccountRegisteredListener(NewsletterService newsletter) {
        this.newsletter = newsletter;
    }

    @EventListener
    public void attach(AccountRegistered event) {
        newsletter.attachAccount(event.accountId(), event.email(), event.firstName(), event.lastName(), event.wantsNewsletter());
    }
}
