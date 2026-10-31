package com.brandonkamga.lescracks.mail.infra;

import com.brandonkamga.lescracks.mail.domain.EventAnnouncement;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;

class EventAnnouncementTemplateTest {

    private final EventAnnouncementTemplate template = new EventAnnouncementTemplate(new EmailLayout("https://lescracks.com"));

    private static final String DESCRIPTION = """
            **La tech au service des femmes : comprendre, protéger, accompagner.**

            ## Pourquoi ce hackathon

            Octobre Rose nous rappelle que beaucoup de difficultés vécues par les femmes restent sans réponse : accès aux soins, santé menstruelle, violences, éducation.

            ## Le défi

            - **Éducation** : orientation, formation.
            - **Santé** : prévention et dépistage des cancers du sein.

            ## Calendrier

            Clôture le 15 novembre. Toutes les règles sont sur la page.
            """;

    @Test
    @DisplayName("the announcement sums the description up in plain words and sends the reader to the page for the rest")
    void summarisesTheDescription() {
        var rendered = template.render(new EventAnnouncement("awa@example.com", "Hackathon 001", DESCRIPTION,
                "/evenements/hackathon-001", null, Instant.parse("2026-10-30T23:00:00Z"), "t0k3n"));

        assertThat(rendered.html())
                .contains("La tech au service des femmes : comprendre, protéger, accompagner. Octobre Rose nous rappelle")
                .contains("…")
                .doesNotContain("##", "**", "Pourquoi ce hackathon", "Toutes les règles sont sur la page")
                .contains("href=\"https://lescracks.com/evenements/hackathon-001\"");
        assertThat(rendered.text()).doesNotContain("Calendrier").contains("https://lescracks.com/evenements/hackathon-001");
    }

    @Test
    @DisplayName("the cover and the title open the event page, not only the button")
    void coverAndTitleOpenThePage() {
        var rendered = template.render(new EventAnnouncement("awa@example.com", "Hackathon 001", DESCRIPTION,
                "/evenements/hackathon-001", "/api/files/cover.jpg", null, null));

        assertThat(rendered.html())
                .containsPattern("<a href=\"https://lescracks.com/evenements/hackathon-001\"[^>]*><img src=\"https://lescracks.com/api/files/cover.jpg\"")
                .containsPattern("<h1[^>]*><a href=\"https://lescracks.com/evenements/hackathon-001\"[^>]*>Hackathon 001</a></h1>");
    }

    @Test
    @DisplayName("a short description is kept whole")
    void keepsAShortDescription() {
        var rendered = template.render(new EventAnnouncement("awa@example.com", "Atelier Git", "Une heure pour *enfin* comprendre le rebase.",
                "/evenements/atelier-git", null, null, null));

        assertThat(rendered.html()).contains("Une heure pour enfin comprendre le rebase.").doesNotContain("…");
    }
}
