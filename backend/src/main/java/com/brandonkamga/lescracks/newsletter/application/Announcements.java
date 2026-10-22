package com.brandonkamga.lescracks.newsletter.application;

/** What other modules call when something new is published: every subscriber gets an email. */
public interface Announcements {

    void announceEvent(EventNews news);

    void announceArticle(ArticleNews news);
}
