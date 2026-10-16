package com.brandonkamga.lescracks.mail.infra;

import com.brandonkamga.lescracks.mail.domain.PasswordResetEmail;

import org.springframework.stereotype.Component;

@Component
public class PasswordResetEmailTemplate implements EmailTemplate<PasswordResetEmail> {
    private final EmailLayout layout;

    public PasswordResetEmailTemplate(EmailLayout layout) {
        this.layout = layout;
    }

    @Override
    public Class<PasswordResetEmail> type() {
        return PasswordResetEmail.class;
    }

    @Override
    public RenderedEmail render(PasswordResetEmail email) {
        String link = layout.url("/reinitialiser?token=" + email.token());
        String body = layout.heading("Réinitialise ton mot de passe")
                        + layout.paragraph("Tu as demandé à changer le mot de passe de ton compte LesCracks. Choisis-en un nouveau avec le bouton ci-dessous.")
                        + layout.button("Choisir un nouveau mot de passe", link)
                        + layout.paragraph("<span style=\"font-size:14px;color:#6b6b6b;\">Ce lien expire dans 30 minutes.</span>")
                        + layout.fallbackLink("Si le bouton ne fonctionne pas, ouvre ce lien :", link);
        return layout.email("Réinitialise ton mot de passe LesCracks", "Réinitialise ton mot de passe", body,
                "Tu reçois cet email parce qu'une réinitialisation a été demandée pour cette adresse. Si ce n'est pas toi, ignore ce message : ton mot de passe ne change pas.");
    }
}
