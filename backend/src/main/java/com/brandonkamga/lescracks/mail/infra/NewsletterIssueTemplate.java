package com.brandonkamga.lescracks.mail.infra;

import com.brandonkamga.lescracks.mail.domain.NewsletterIssue;

import org.springframework.stereotype.Component;

@Component
public class NewsletterIssueTemplate implements EmailTemplate<NewsletterIssue> {
    private final EmailLayout layout;
    private final EmailBodyRenderer bodies;

    public NewsletterIssueTemplate(EmailLayout layout, EmailBodyRenderer bodies) {
        this.layout = layout;
        this.bodies = bodies;
    }

    @Override
    public Class<NewsletterIssue> type() {
        return NewsletterIssue.class;
    }

    @Override
    public RenderedEmail render(NewsletterIssue email) {
        String body = bodies.render(email.body(), text -> text
                .replace("{{firstName}}", email.firstName() == null ? "" : email.firstName())
                .replace("{{lastName}}", email.lastName() == null ? "" : email.lastName())
                .replace("{{email}}", email.to()));
        String subject = email.subject() == null ? "" : email.subject();
        return new RenderedEmail(subject, layout.frame(subject, body, EmailLayout.NEWSLETTER_NOTE));
    }
}
