package com.brandonkamga.lescracks.mail.infra;

import com.brandonkamga.lescracks.mail.domain.NewsletterConfirmation;

import org.springframework.stereotype.Component;

@Component
public class NewsletterConfirmationTemplate implements EmailTemplate<NewsletterConfirmation> {
    private final EmailLayout layout;

    public NewsletterConfirmationTemplate(EmailLayout layout) {
        this.layout = layout;
    }

    @Override
    public Class<NewsletterConfirmation> type() {
        return NewsletterConfirmation.class;
    }

    @Override
    public RenderedEmail render(NewsletterConfirmation email) {
        String link = layout.url("/newsletter/confirmer?token=" + email.token());
        String body = layout.heading("Confirme ton inscription")
                + layout.paragraph("Tu as demandé à recevoir la newsletter LesCracks : les nouvelles ressources et les prochains ateliers. Un clic pour confirmer, et c’est parti.")
                + layout.button("Confirmer mon inscription", link)
                + layout.fallbackLink("Si le bouton ne fonctionne pas, ouvre ce lien :", link);
        return layout.email("Confirme ton inscription à la newsletter LesCracks", "Confirme ton inscription", body,
                "Tu reçois cet email parce que cette adresse a été inscrite sur lescracks.com. Si ce n'est pas toi, ignore ce message : tu ne recevras rien d'autre.");
    }
}
