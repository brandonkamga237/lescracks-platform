package com.brandonkamga.lescracks.mail.infra;

import com.brandonkamga.lescracks.mail.domain.ResourceAnnouncement;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class ResourceAnnouncementTemplateTest {

    private final ResourceAnnouncementTemplate template = new ResourceAnnouncementTemplate(new EmailLayout("https://lescracks.com"));

    @Test
    @DisplayName("the announcement sums a long description up and links the article for the rest")
    void summarisesALongDescription() {
        String description = "Pourquoi une requête passe de 2 s à 3 ms avec le **bon index**. ".repeat(8);

        var rendered = template.render(new ResourceAnnouncement("awa@example.com", "Les index PostgreSQL", description,
                "/ressources/index-postgresql", null, "t0k3n"));

        assertThat(rendered.html())
                .contains("Pourquoi une requête passe de 2 s à 3 ms avec le bon index.")
                .contains("…")
                .doesNotContain("**", "Ou ouvre ce lien")
                .contains("href=\"https://lescracks.com/ressources/index-postgresql\"");
    }
}
