package com.brandonkamga.lescracks.mail.infra;

import com.brandonkamga.lescracks.mail.domain.EventAnnouncement;

import org.springframework.stereotype.Component;

import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

@Component
public class EventAnnouncementTemplate implements EmailTemplate<EventAnnouncement> {
    private static final DateTimeFormatter DATE = DateTimeFormatter.ofPattern("EEEE d MMMM 'à' HH'h'mm", Locale.FRANCE);

    private final EmailLayout layout;

    public EventAnnouncementTemplate(EmailLayout layout) {
        this.layout = layout;
    }

    @Override
    public Class<EventAnnouncement> type() {
        return EventAnnouncement.class;
    }

    @Override
    public RenderedEmail render(EventAnnouncement email) {
        String title = layout.escapeHtml(email.title());
        String url = layout.url(email.path());
        String date = email.startsAt() == null ? "" : layout.paragraph("<strong style=\"color:#0b0b0b;\">"
                + layout.escapeHtml(DATE.format(email.startsAt().atZone(ZoneId.of("Europe/Paris")))) + "</strong>");
        String body = layout.heading(title)
                        + layout.cover(layout.absoluteImage(email.coverImage()), title) + date
                        + layout.paragraph(layout.escapeHtml(email.description()))
                        + layout.button("Voir l'événement", url) + layout.fallbackLink("Ou ouvre ce lien :", url);
        return layout.newsletter("Nouvel événement LesCracks : " + email.title(), email.title(), body, email.unsubscribeToken());
    }
}
