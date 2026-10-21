package com.brandonkamga.lescracks.mail.infra;

import com.brandonkamga.lescracks.mail.domain.CertificateIssuedEmail;

import org.springframework.stereotype.Component;

@Component
public class CertificateIssuedEmailTemplate implements EmailTemplate<CertificateIssuedEmail> {
    private final EmailLayout layout;

    public CertificateIssuedEmailTemplate(EmailLayout layout) {
        this.layout = layout;
    }

    @Override
    public Class<CertificateIssuedEmail> type() {
        return CertificateIssuedEmail.class;
    }

    @Override
    public RenderedEmail render(CertificateIssuedEmail email) {
        String link = layout.url("/attestations/" + email.code());
        String name = email.firstName() == null ? "" : email.firstName().trim();
        String greeting = name.isEmpty() ? "Bonjour," : "Bonjour " + layout.escapeHtml(name) + ",";
        String body = layout.heading("Ton attestation est prête")
                + layout.paragraph(greeting)
                + layout.paragraph("LesCracks atteste que tu " + layout.escapeHtml(email.title()) + ". Bravo !")
                + layout.paragraph("Tu peux l’ouvrir, la télécharger en PDF et la partager : n’importe qui peut la vérifier avec son code <strong>"
                        + layout.escapeHtml(email.code()) + "</strong>.")
                + layout.button("Voir mon attestation", link)
                + layout.fallbackLink("Si le bouton ne fonctionne pas, ouvre ce lien :", link);
        return layout.email("Ton attestation LesCracks", "Ton attestation est prête", body,
                "Tu reçois cet email parce qu’une attestation LesCracks vient d’être émise à ton nom.");
    }
}
