package com.brandonkamga.lescracks.mail.infra;

import com.brandonkamga.lescracks.mail.domain.VerificationEmail;

import org.springframework.stereotype.Component;

@Component
public class VerificationEmailTemplate implements EmailTemplate<VerificationEmail> {
    private final EmailLayout layout;

    public VerificationEmailTemplate(EmailLayout layout) {
        this.layout = layout;
    }

    @Override
    public Class<VerificationEmail> type() {
        return VerificationEmail.class;
    }

    @Override
    public RenderedEmail render(VerificationEmail email) {
        String link = layout.url("/verifier-email?token=" + email.token());
        String name = email.firstName() == null ? "" : email.firstName().trim();
        String greeting = name.isEmpty() ? "Bonjour," : "Bonjour " + layout.escapeHtml(name) + ",";
        String body = layout.heading("Confirme ton adresse email")
                        + layout.paragraph(greeting)
                        + layout.paragraph("Pour activer ton compte LesCracks, confirme ton adresse en cliquant sur le bouton ci-dessous.")
                        + layout.button("Confirmer mon adresse", link)
                        + layout.paragraph("<span style=\"font-size:14px;color:#6b6b6b;\">Ce lien expire dans 24 heures.</span>")
                        + layout.fallbackLink("Si le bouton ne fonctionne pas, ouvre ce lien :", link);
        return layout.email("Confirme ton adresse email LesCracks", "Confirme ton adresse email", body,
                "Tu reçois cet email parce qu'un compte LesCracks a été créé avec cette adresse. Si ce n'est pas toi, ignore simplement ce message.");
    }
}
