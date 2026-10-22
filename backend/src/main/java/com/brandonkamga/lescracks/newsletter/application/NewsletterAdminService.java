package com.brandonkamga.lescracks.newsletter.application;

import com.brandonkamga.lescracks.newsletter.domain.model.Campaign;
import com.brandonkamga.lescracks.newsletter.domain.model.Subscriber;
import com.brandonkamga.lescracks.newsletter.domain.model.SubscriptionStatus;

import com.fasterxml.jackson.databind.JsonNode;

import java.util.List;

/** The back office's side of the list: subscribers, campaigns, announcements. */
public interface NewsletterAdminService {

    /** Everyone with that status, or everyone when it is null, newest first. */
    List<Subscriber> listSubscribers(SubscriptionStatus status);

    Subscriber subscribe(Long subscriberId);

    Subscriber unsubscribe(Long subscriberId);

    /** Sends the issue to every subscriber and records the campaign; returns how many got it. */
    int broadcast(String subject, JsonNode body);

    /** The exact email a subscriber would get, filled with a sample reader. */
    String preview(String subject, JsonNode body);

    /** The campaign as subscribers will get it, sent to one address and marked as a test; nothing is recorded. */
    void sendTest(String subject, JsonNode body, String email);

    List<Campaign> listCampaigns();
}
