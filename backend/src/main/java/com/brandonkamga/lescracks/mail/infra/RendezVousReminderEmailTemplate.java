package com.brandonkamga.lescracks.mail.infra;

import com.brandonkamga.lescracks.mail.domain.RendezVousReminderEmail;

import org.springframework.stereotype.Component;

import java.time.format.DateTimeFormatter;
import java.util.Locale;

@Component
public class RendezVousReminderEmailTemplate implements EmailTemplate<RendezVousReminderEmail> {
    private static final DateTimeFormatter DAY_AND_TIME = DateTimeFormatter.ofPattern("EEEE d MMMM 'à' HH'h'mm", Locale.FRANCE);
    private static final DateTimeFormatter TIME = DateTimeFormatter.ofPattern("HH'h'mm", Locale.FRANCE);

    private final EmailLayout layout;

    public RendezVousReminderEmailTemplate(EmailLayout layout) {
        this.layout = layout;
    }

    @Override
    public Class<RendezVousReminderEmail> type() {
        return RendezVousReminderEmail.class;
    }

    @Override
    public RenderedEmail render(RendezVousReminderEmail email) {
        var start = email.startDate().atZone(EmailLayout.COMMUNITY_TIME);
        String title = layout.escapeHtml(email.title());
        String page = layout.url(email.path());
        String name = email.firstName() == null ? "" : email.firstName().trim();
        String greeting = name.isEmpty() ? "Bonjour," : "Bonjour " + layout.escapeHtml(name) + ",";
        String when = email.withinTheHour()
                ? "« " + title + " » commence à " + TIME.format(start) + " (GMT+1), dans moins d’une heure."
                : "Petit rappel : « " + title + " » a lieu " + layout.escapeHtml(DAY_AND_TIME.format(start)) + " (GMT+1).";

        String location = email.location() == null ? "" : email.location().trim();
        boolean online = location.startsWith("https://") || location.startsWith("http://");
        StringBuilder body = new StringBuilder(layout.heading(title))
                .append(layout.paragraph(greeting))
                .append(layout.paragraph(when));
        if (online) {
            body.append(layout.button("Rejoindre", location))
                    .append(layout.fallbackLink("Le lien pour rejoindre :", location))
                    .append(layout.fallbackLink("La page du rendez-vous :", page));
        } else {
            if (!location.isEmpty()) body.append(layout.paragraph("Lieu : " + layout.escapeHtml(location)));
            body.append(layout.button("Voir le rendez-vous", page))
                    .append(layout.fallbackLink("Si le bouton ne fonctionne pas, ouvre ce lien :", page));
        }

        String subject = email.withinTheHour()
                ? "Dans une heure : « " + email.title() + " »"
                : "Rappel : « " + email.title() + " », " + DAY_AND_TIME.format(start);
        return layout.email(subject, email.title(), body.toString(),
                "Tu reçois cet email parce que tu as demandé un rappel pour ce rendez-vous sur LesCracks.");
    }
}
