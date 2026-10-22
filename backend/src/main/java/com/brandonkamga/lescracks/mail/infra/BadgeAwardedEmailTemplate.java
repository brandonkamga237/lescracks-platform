package com.brandonkamga.lescracks.mail.infra;

import com.brandonkamga.lescracks.mail.domain.BadgeAwardedEmail;

import org.springframework.stereotype.Component;

@Component
public class BadgeAwardedEmailTemplate implements EmailTemplate<BadgeAwardedEmail> {
    private final EmailLayout layout;

    public BadgeAwardedEmailTemplate(EmailLayout layout) {
        this.layout = layout;
    }

    @Override
    public Class<BadgeAwardedEmail> type() {
        return BadgeAwardedEmail.class;
    }

    @Override
    public RenderedEmail render(BadgeAwardedEmail email) {
        String link = layout.url("/membres/" + email.memberId());
        String name = email.firstName() == null ? "" : email.firstName().trim();
        String greeting = name.isEmpty() ? "Bonjour," : "Bonjour " + layout.escapeHtml(name) + ",";
        String reason = email.reason() == null || email.reason().isBlank() ? ""
                : layout.paragraph("Pourquoi : " + layout.escapeHtml(email.reason()) + ".");
        String body = layout.heading("Tu as reçu le badge « " + layout.escapeHtml(email.badgeName()) + " »")
                + layout.paragraph(greeting)
                + layout.paragraph(layout.escapeHtml(email.badgeDescription()))
                + reason
                + layout.paragraph("Il s’affiche désormais sur ton profil public, visible par toute la communauté. Bravo !")
                + layout.button("Voir mon profil", link)
                + layout.fallbackLink("Si le bouton ne fonctionne pas, ouvre ce lien :", link);
        return layout.email("Nouveau badge : " + email.badgeName(), "Un nouveau badge sur ton profil LesCracks", body,
                "Tu reçois cet email parce qu’un badge LesCracks vient de t’être attribué.");
    }
}
