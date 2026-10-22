package com.brandonkamga.lescracks.newsletter.application;

import com.brandonkamga.lescracks.newsletter.domain.model.SubscriptionStatus;
import com.brandonkamga.lescracks.newsletter.domain.port.SubscriberStore;
import com.brandonkamga.lescracks.mail.domain.EventAnnouncement;
import com.brandonkamga.lescracks.mail.domain.Mailer;
import com.brandonkamga.lescracks.mail.domain.ResourceAnnouncement;

public class AnnouncementsImpl implements Announcements {
    private final SubscriberStore subscribers;
    private final Mailer mail;

    public AnnouncementsImpl(SubscriberStore subscribers, Mailer mail) {
        this.subscribers = subscribers;
        this.mail = mail;
    }

    @Override
    public void announceEvent(EventNews news) {
        subscribers.findAll(SubscriptionStatus.SUBSCRIBED).forEach(subscriber -> mail.send(new EventAnnouncement(
                subscriber.getEmail(), news.title(), news.description(), news.path(), news.coverImage(), news.startDate(),
                subscriber.getToken())));
    }

    @Override
    public void announceArticle(ArticleNews news) {
        subscribers.findAll(SubscriptionStatus.SUBSCRIBED).forEach(subscriber -> mail.send(new ResourceAnnouncement(
                subscriber.getEmail(), news.title(), news.description(), news.path(), news.coverImage(), subscriber.getToken())));
    }
}
