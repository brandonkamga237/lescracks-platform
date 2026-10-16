package com.brandonkamga.lescracks.mail.infra;

import com.brandonkamga.lescracks.mail.domain.ResourceAnnouncement;

import org.springframework.stereotype.Component;

@Component
public class ResourceAnnouncementTemplate implements EmailTemplate<ResourceAnnouncement> {
    private final EmailLayout layout;

    public ResourceAnnouncementTemplate(EmailLayout layout) {
        this.layout = layout;
    }

    @Override
    public Class<ResourceAnnouncement> type() {
        return ResourceAnnouncement.class;
    }

    @Override
    public RenderedEmail render(ResourceAnnouncement email) {
        String title = layout.escapeHtml(email.title());
        String url = layout.url(email.path());
        String body = layout.heading(title)
                        + layout.cover(layout.absoluteImage(email.coverImage()), title)
                        + layout.paragraph(layout.escapeHtml(email.description()))
                        + layout.button("Découvrir la ressource", url) + layout.fallbackLink("Ou ouvre ce lien :", url);
        return layout.email("Nouvelle ressource LesCracks : " + email.title(), email.title(), body, EmailLayout.NEWSLETTER_NOTE);
    }
}
