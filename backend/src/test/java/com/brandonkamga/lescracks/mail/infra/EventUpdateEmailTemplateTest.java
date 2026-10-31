package com.brandonkamga.lescracks.mail.infra;

import com.brandonkamga.lescracks.mail.domain.EventUpdateEmail;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;

class EventUpdateEmailTemplateTest {

    private final EventUpdateEmailTemplate template = new EventUpdateEmailTemplate(new EmailLayout("https://lescracks.com"));

    @Test
    @DisplayName("the email greets the member, keeps the message's paragraphs, links the event and gives the deadline in GMT+1")
    void rendersTheUpdate() {
        var rendered = template.render(new EventUpdateEmail("awa@example.com", "Awa", "Hackathon 001", "/evenements/hackathon-001",
                "Le thème change.\nLigne deux.\n\nNouveau paragraphe <b>gras</b>.", Instant.parse("2026-11-15T22:59:00Z")));

        assertThat(rendered.subject()).isEqualTo("Du nouveau sur « Hackathon 001 »");
        assertThat(rendered.html())
                .contains("Bonjour Awa,")
                .contains("Le thème change.<br>Ligne deux.")
                .contains("&lt;b&gt;gras&lt;/b&gt;").doesNotContain("<b>gras")
                .contains("https://lescracks.com/evenements/hackathon-001")
                .contains("dimanche 15 novembre à 23h59 (GMT+1)");
        assertThat(rendered.text()).contains("Le thème change.").contains("https://lescracks.com/evenements/hackathon-001");
    }

    @Test
    @DisplayName("without a first name or a deadline the email still reads well")
    void withoutNameOrDeadline() {
        var rendered = template.render(new EventUpdateEmail("x@example.com", " ", "Atelier", "/evenements/atelier", "Salle changée.", null));

        assertThat(rendered.html()).contains("Bonjour,").doesNotContain("Clôture");
    }
}
