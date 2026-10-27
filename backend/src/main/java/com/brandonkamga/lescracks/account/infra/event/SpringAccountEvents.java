package com.brandonkamga.lescracks.account.infra.event;

import com.brandonkamga.lescracks.account.domain.model.AccountDeleting;
import com.brandonkamga.lescracks.account.domain.model.AccountRegistered;
import com.brandonkamga.lescracks.account.domain.model.AccountRenamed;
import com.brandonkamga.lescracks.account.domain.port.AccountEvents;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Component;

/** Hands account's events to Spring, where other modules listen without account knowing them. */
@Component
public class SpringAccountEvents implements AccountEvents {

    private final ApplicationEventPublisher publisher;

    public SpringAccountEvents(ApplicationEventPublisher publisher) {
        this.publisher = publisher;
    }

    @Override
    public void registered(AccountRegistered event) {
        publisher.publishEvent(event);
    }

    @Override
    public void renamed(AccountRenamed event) {
        publisher.publishEvent(event);
    }

    @Override
    public void deleting(AccountDeleting event) {
        publisher.publishEvent(event);
    }
}
