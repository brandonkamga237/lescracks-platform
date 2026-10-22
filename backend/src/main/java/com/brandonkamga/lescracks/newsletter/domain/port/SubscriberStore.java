package com.brandonkamga.lescracks.newsletter.domain.port;

import com.brandonkamga.lescracks.newsletter.domain.model.Subscriber;
import com.brandonkamga.lescracks.newsletter.domain.model.SubscriptionStatus;

import java.util.List;
import java.util.Optional;

public interface SubscriberStore {

    Optional<Subscriber> findById(Long id);

    /** Ignores case. */
    Optional<Subscriber> findByEmail(String email);

    Optional<Subscriber> findByToken(String token);

    /** Everyone with that status, or everyone when it is null, newest first. */
    List<Subscriber> findAll(SubscriptionStatus status);

    Subscriber save(Subscriber subscriber);
}
