package com.brandonkamga.lescracks.mail.infra;

import com.brandonkamga.lescracks.mail.domain.EventUpdateEmail;

import org.springframework.stereotype.Component;

import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.Locale;
import java.util.stream.Collectors;

@Component
public class EventUpdateEmailTemplate implements EmailTemplate<EventUpdateEmail> {
    private static final DateTimeFormatter DEADLINE = DateTimeFormatter.ofPattern("EEEE d MMMM 'à' HH'h'mm", Locale.FRANCE);

    private final EmailLayout layout;

    public EventUpdateEmailTemplate(EmailLayout layout) {
        this.layout = layout;
    }

    @Override
    public Class<EventUpdateEmail> type() {
        return EventUpdateEmail.class;
    }

    @Override
    public RenderedEmail render(EventUpdateEmail email) {
        String title = layout.escapeHtml(email.eventTitle());
        String url = layout.url(email.eventPath());
        String name = email.firstName() == null ? "" : email.firstName().trim();
        String greeting = name.isEmpty() ? "Bonjour," : "Bonjour " + layout.escapeHtml(name) + ",";
        String deadline = email.submissionsCloseAt() == null ? ""
                : layout.paragraph("<strong style=\"color:#0b0b0b;\">Clôture : "
                + layout.escapeHtml(DEADLINE.format(email.submissionsCloseAt().atZone(EmailLayout.COMMUNITY_TIME))) + " (GMT+1)</strong>");
        String body = layout.heading(title)
                + layout.paragraph(greeting)
                + paragraphs(email.message())
                + deadline
                + layout.button("Voir l'événement", url)
                + layout.fallbackLink("Si le bouton ne fonctionne pas, ouvre ce lien :", url);
        return layout.email("Du nouveau sur « " + email.eventTitle() + " »", email.eventTitle(), body,
                "Tu reçois cet email parce que tu es inscrit à cet événement sur LesCracks.");
    }

    /** Blank lines separate paragraphs; a single line break stays a line break. */
    private String paragraphs(String message) {
        return Arrays.stream(message.strip().split("\\R\\s*\\R"))
                .map(block -> layout.paragraph(layout.escapeHtml(block.strip()).replaceAll("\\R", "<br>")))
                .collect(Collectors.joining());
    }
}
