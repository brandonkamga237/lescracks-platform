package com.brandonkamga.lescracks.mail.infra;

import com.brandonkamga.lescracks.mail.domain.RendezVousReminderEmail;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;

class RendezVousReminderEmailTemplateTest {

    private final RendezVousReminderEmailTemplate template = new RendezVousReminderEmailTemplate(new EmailLayout("https://lescracks.com"));
    private final Instant start = Instant.parse("2026-12-04T18:00:00Z");

    @Test
    @DisplayName("the day before, the email gives the day and time in GMT+1 and the link to join an online rendez-vous")
    void dayBeforeOnline() {
        var rendered = template.render(new RendezVousReminderEmail("awa@example.com", "Awa", "Git en équipe", "/rendez-vous/git-en-equipe",
                start, false, "https://meet.example.com/git"));

        assertThat(rendered.subject()).isEqualTo("Rappel : « Git en équipe », vendredi 4 décembre à 19h00");
        assertThat(rendered.html())
                .contains("Bonjour Awa,")
                .contains("vendredi 4 décembre à 19h00 (GMT+1)")
                .contains(">Rejoindre<").contains("https://meet.example.com/git")
                .contains("https://lescracks.com/rendez-vous/git-en-equipe");
        assertThat(rendered.text()).contains("https://meet.example.com/git");
    }

    @Test
    @DisplayName("within the hour, the email says so and names the place of a rendez-vous held on site")
    void withinTheHourOnSite() {
        var rendered = template.render(new RendezVousReminderEmail("kofi@example.com", null, "API <qui dure>", "/rendez-vous/api",
                start, true, "Salle 2, campus"));

        assertThat(rendered.subject()).isEqualTo("Dans une heure : « API <qui dure> »");
        assertThat(rendered.html())
                .contains("Bonjour,")
                .contains("commence à 19h00 (GMT+1), dans moins d’une heure.")
                .contains("API &lt;qui dure&gt;").doesNotContain("<qui dure>")
                .contains("Lieu : Salle 2, campus")
                .contains(">Voir le rendez-vous<").doesNotContain(">Rejoindre<");
    }
}
