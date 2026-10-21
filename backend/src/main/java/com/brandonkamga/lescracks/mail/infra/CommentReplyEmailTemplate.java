package com.brandonkamga.lescracks.mail.infra;

import com.brandonkamga.lescracks.mail.domain.CommentReplyEmail;

import org.springframework.stereotype.Component;

@Component
public class CommentReplyEmailTemplate implements EmailTemplate<CommentReplyEmail> {
    private final EmailLayout layout;

    public CommentReplyEmailTemplate(EmailLayout layout) {
        this.layout = layout;
    }

    @Override
    public Class<CommentReplyEmail> type() {
        return CommentReplyEmail.class;
    }

    @Override
    public RenderedEmail render(CommentReplyEmail email) {
        String link = layout.url(email.articlePath());
        String name = email.firstName() == null ? "" : email.firstName().trim();
        String greeting = name.isEmpty() ? "Bonjour," : "Bonjour " + layout.escapeHtml(name) + ",";
        String body = layout.heading("On t’a répondu")
                + layout.paragraph(greeting)
                + layout.paragraph(layout.escapeHtml(email.replierName()) + " a répondu à ton commentaire sur « "
                        + layout.escapeHtml(email.articleTitle()) + " » :")
                + layout.paragraph("<em>« " + layout.escapeHtml(email.excerpt()) + " »</em>")
                + layout.button("Voir la discussion", link)
                + layout.fallbackLink("Si le bouton ne fonctionne pas, ouvre ce lien :", link);
        return layout.email(email.replierName() + " t’a répondu sur LesCracks", "On t’a répondu", body,
                "Tu reçois cet email parce que quelqu’un a répondu à ton commentaire sur LesCracks.");
    }
}
