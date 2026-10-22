package com.brandonkamga.lescracks.identity.infra.event;

import com.brandonkamga.lescracks.identity.domain.signup.MemberEvents;
import com.brandonkamga.lescracks.identity.domain.signup.MemberRegistered;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Component;

/** Hands identity's events to Spring, where other domains listen without identity knowing them. */
@Component
public class SpringMemberEvents implements MemberEvents {

    private final ApplicationEventPublisher publisher;

    public SpringMemberEvents(ApplicationEventPublisher publisher) {
        this.publisher = publisher;
    }

    @Override
    public void registered(MemberRegistered event) {
        publisher.publishEvent(event);
    }
}
