package com.brandonkamga.lescracks.newsletter.application;

import com.brandonkamga.lescracks.newsletter.domain.model.Subscriber;

/** A member or a visitor joining and leaving the list. */
public interface NewsletterService {

    /** The member's subscription; a member who never subscribed gets an unsaved UNSUBSCRIBED one. */
    Subscriber view(String email);

    Subscriber subscribe(String email);

    /** From the public form: the address must confirm before anything else is sent to it. */
    Subscriber subscribePublic(String email, String firstName, String lastName);

    /** The link of the confirmation email. */
    void confirm(String token);

    Subscriber unsubscribe(String email);

    /** From the link in a newsletter email; using it twice is harmless. */
    void unsubscribeByToken(String token);

    /** A new account: its address joins its subscription if it had one, and subscribes if asked. */
    void attachAccount(Long accountId, String email, String firstName, String lastName, boolean wantsNewsletter);
}
