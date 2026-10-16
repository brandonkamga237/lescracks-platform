package com.brandonkamga.lescracks.mail.infra;

import com.brandonkamga.lescracks.mail.domain.Email;
import com.brandonkamga.lescracks.mail.domain.NewsletterConfirmation;
import com.brandonkamga.lescracks.mail.domain.NewsletterIssue;
import com.brandonkamga.lescracks.mail.domain.PasswordResetEmail;
import com.brandonkamga.lescracks.mail.domain.VerificationEmail;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class EmailTemplatesTest {

    private final EmailLayout layout = new EmailLayout("https://lescracks.com/");
    private final EmailTemplates templates = new EmailTemplates(List.of(
            new VerificationEmailTemplate(layout),
            new PasswordResetEmailTemplate(layout),
            new NewsletterConfirmationTemplate(layout),
            new NewsletterIssueTemplate(layout, new EmailBodyRenderer("https://lescracks.com"))));

    @Test
    @DisplayName("a newsletter is personalised and wrapped in the fixed frame")
    void wrapsTheNewsletterInTheFixedFrame() throws Exception {
        var body = new ObjectMapper().readTree("""
                [{"type": "paragraph", "text": "Bonjour {{firstName}}"}]
                """);

        RenderedEmail rendered = templates.render(new NewsletterIssue("marie@example.com", "Les <nouveautés>", body, "Marie", "Kamga", null));

        assertThat(rendered.subject()).isEqualTo("Les <nouveautés>");
        assertThat(rendered.html())
                .contains("src=\"https://lescracks.com/images/email-logo.png\"", "alt=\"LesCracks\"")
                .contains("Bonjour Marie")
                .contains("<title>Les &lt;nouveautés&gt;</title>")
                .contains("abonné à la newsletter LesCracks")
                .doesNotContain("{{firstName}}", "text-transform:uppercase");
    }

    @Test
    @DisplayName("a newsletter sent to a subscriber links to the unsubscribe page and offers one-click unsubscribe")
    void unsubscribeLinkAndHeaders() throws Exception {
        var body = new ObjectMapper().readTree("[{\"type\": \"paragraph\", \"text\": \"Bonjour\"}]");

        RenderedEmail rendered = templates.render(new NewsletterIssue("marie@example.com", "Nouveautés", body, "Marie", "Kamga", "t0k3n"));

        assertThat(rendered.html()).contains("href=\"https://lescracks.com/desabonnement?token=t0k3n\"", "Se désabonner");
        assertThat(rendered.text()).contains("Se désabonner : https://lescracks.com/desabonnement?token=t0k3n");
        assertThat(rendered.headers())
                .containsEntry("List-Unsubscribe", "<https://lescracks.com/api/newsletter/public/unsubscribe?token=t0k3n>")
                .containsEntry("List-Unsubscribe-Post", "List-Unsubscribe=One-Click");
    }

    @Test
    @DisplayName("a preview has no unsubscribe link and no list headers")
    void previewHasNoUnsubscribe() throws Exception {
        var body = new ObjectMapper().readTree("[{\"type\": \"paragraph\", \"text\": \"Bonjour\"}]");

        RenderedEmail rendered = templates.render(new NewsletterIssue("marie@example.com", "Nouveautés", body, "Marie", "Kamga", null));

        assertThat(rendered.html()).doesNotContain("desabonnement");
        assertThat(rendered.headers()).isEmpty();
    }

    @Test
    @DisplayName("the verification email links to the verification page with its token, and escapes the name")
    void verificationLink() {
        RenderedEmail rendered = templates.render(new VerificationEmail("awa@example.com", "<Awa>", "abc"));

        assertThat(rendered.html())
                .contains("href=\"https://lescracks.com/verifier-email?token=abc\"")
                .contains("Bonjour &lt;Awa&gt;,");
    }

    @Test
    @DisplayName("the text part says the same thing, with the link spelled out and no markup")
    void textPart() {
        String text = templates.render(new VerificationEmail("awa@example.com", "Awa", "abc")).text();

        assertThat(text)
                .startsWith("Confirme ton adresse email")
                .contains("Bonjour Awa,")
                .contains("Confirmer mon adresse : https://lescracks.com/verifier-email?token=abc")
                .contains("Ce lien expire dans 24 heures.")
                .contains("\n--\nTu reçois cet email")
                .doesNotContain("<", "&nbsp;", "\n\n\n");
    }

    @Test
    @DisplayName("the newsletter confirmation links to the confirmation page with its token")
    void confirmationLink() {
        assertThat(templates.render(new NewsletterConfirmation("awa@example.com", "c0nf")).html())
                .contains("href=\"https://lescracks.com/newsletter/confirmer?token=c0nf\"");
    }

    @Test
    @DisplayName("the reset email links to the reset page with its token")
    void resetLink() {
        assertThat(templates.render(new PasswordResetEmail("awa@example.com", "xyz")).html())
                .contains("href=\"https://lescracks.com/reinitialiser?token=xyz\"");
    }

    @Test
    @DisplayName("an email kind without a template fails loudly instead of sending nothing")
    void unknownKind() {
        record Unknown(String to) implements Email {
        }

        assertThatThrownBy(() -> templates.render(new Unknown("a@example.com"))).isInstanceOf(IllegalStateException.class);
    }
}
