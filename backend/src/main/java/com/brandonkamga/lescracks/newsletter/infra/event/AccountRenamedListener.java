package com.brandonkamga.lescracks.newsletter.infra.event;

import com.brandonkamga.lescracks.account.domain.model.AccountRenamed;
import com.brandonkamga.lescracks.newsletter.application.NewsletterService;

import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

/** Runs in the rename transaction: the list never greets a member by a name they dropped. */
@Component
public class AccountRenamedListener {

    private final NewsletterService newsletter;

    public AccountRenamedListener(NewsletterService newsletter) {
        this.newsletter = newsletter;
    }

    @EventListener
    public void rename(AccountRenamed event) {
        newsletter.renameSubscriber(event.email(), event.firstName(), event.lastName());
    }
}
