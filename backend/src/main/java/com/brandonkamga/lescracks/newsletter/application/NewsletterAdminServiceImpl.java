package com.brandonkamga.lescracks.newsletter.application;

import com.brandonkamga.lescracks.newsletter.domain.model.Campaign;
import com.brandonkamga.lescracks.newsletter.domain.model.Subscriber;
import com.brandonkamga.lescracks.newsletter.domain.model.SubscriptionStatus;
import com.brandonkamga.lescracks.newsletter.domain.port.CampaignStore;
import com.brandonkamga.lescracks.newsletter.domain.port.SubscriberStore;
import com.brandonkamga.lescracks.mail.domain.Mailer;
import com.brandonkamga.lescracks.mail.domain.NewsletterIssue;
import com.brandonkamga.lescracks.shared.exception.NotFoundException;

import com.fasterxml.jackson.databind.JsonNode;

import java.util.List;

public class NewsletterAdminServiceImpl implements NewsletterAdminService {
    private final SubscriberStore subscribers;
    private final CampaignStore campaigns;
    private final Mailer mail;

    public NewsletterAdminServiceImpl(SubscriberStore subscribers, CampaignStore campaigns, Mailer mail) {
        this.subscribers = subscribers;
        this.campaigns = campaigns;
        this.mail = mail;
    }

    @Override
    public List<Subscriber> listSubscribers(SubscriptionStatus status) {
        return subscribers.findAll(status);
    }

    @Override
    public Subscriber subscribe(Long subscriberId) {
        Subscriber subscriber = require(subscriberId);
        subscriber.subscribe();
        return subscribers.save(subscriber);
    }

    @Override
    public Subscriber unsubscribe(Long subscriberId) {
        Subscriber subscriber = require(subscriberId);
        subscriber.unsubscribe();
        return subscribers.save(subscriber);
    }

    @Override
    public int broadcast(String subject, JsonNode body) {
        List<Subscriber> active = subscribers.findAll(SubscriptionStatus.SUBSCRIBED);
        active.forEach(subscriber -> mail.send(new NewsletterIssue(subscriber.getEmail(), subject, body,
                subscriber.getFirstName(), subscriber.getLastName(), subscriber.getToken())));
        campaigns.save(Campaign.builder().subject(subject).message(body.toString()).recipientCount(active.size()).build());
        return active.size();
    }

    @Override
    public String preview(String subject, JsonNode body) {
        return mail.previewHtml(new NewsletterIssue("marie@example.com", subject, body, "Marie", "Kamga", null));
    }

    @Override
    public void sendTest(String subject, JsonNode body, String email) {
        mail.send(new NewsletterIssue(email.trim(), "[Test] " + subject, body, "Marie", "Kamga", null));
    }

    @Override
    public List<Campaign> listCampaigns() {
        return campaigns.findAllNewestFirst();
    }

    private Subscriber require(Long id) {
        return subscribers.findById(id).orElseThrow(() -> new NotFoundException("Abonné", "id", id));
    }
}
