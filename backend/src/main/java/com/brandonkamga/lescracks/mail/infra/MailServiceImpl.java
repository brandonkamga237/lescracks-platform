package com.brandonkamga.lescracks.mail.infra;

import com.brandonkamga.lescracks.event.domain.Event;
import com.brandonkamga.lescracks.mail.domain.MailService;
import com.brandonkamga.lescracks.resource.domain.Resource;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

@Service
public class MailServiceImpl implements MailService {
    private final JavaMailSender sender;
    private final EmailBodyRenderer bodies;
    private final String frontendUrl;
    private final String from;

    public MailServiceImpl(JavaMailSender sender,
                           EmailBodyRenderer bodies,
                           @org.springframework.beans.factory.annotation.Value("${app.site.url:http://localhost:5173}") String frontendUrl,
                           @org.springframework.beans.factory.annotation.Value("${app.mail.from:LesCracks <contact@lescracks.com>}") String from) {
        this.sender = sender;
        this.bodies = bodies;
        this.frontendUrl = frontendUrl.endsWith("/") ? frontendUrl.substring(0, frontendUrl.length() - 1) : frontendUrl;
        this.from = from;
    }

    @Override
    public void sendPasswordReset(String recipient, String token) {
        SimpleMailMessage message = message(recipient);
        message.setSubject("Réinitialisation de votre mot de passe LesCracks");
        message.setText("Bonjour,\n\nRéinitialisez votre mot de passe ici : "
                + frontendUrl + "/reinitialiser?token=" + token
                + "\n\nCe lien expire dans 30 minutes.");
        sender.send(message);
    }

    @Override
    public void sendVerificationEmail(String recipient, String token, String firstName) {
        String name = firstName == null || firstName.isBlank() ? "" : firstName;
        String html = verificationHtml(name, recipient, token);
        sendHtml(recipient, "Confirme ton adresse email LesCracks", html);
    }

    @Override
    public void sendEventNotification(String recipient, Event event) {
        String slug = event.getSlug() != null ? event.getSlug() : String.valueOf(event.getId());
        String url = frontendUrl + "/evenements/" + slug;
        String cover = absoluteImage(event.getCoverImage());
        String html = eventHtml(event.getTitle(), event.getDescription(), url, cover, event.getStartDate());
        sendHtml(recipient, "Nouvel événement LesCracks : " + event.getTitle(), html);
    }

    @Override
    public void sendResourceNotification(String recipient, Resource resource) {
        String slug = resource.getSlug() != null ? resource.getSlug() : String.valueOf(resource.getId());
        String url = frontendUrl + "/ressources/" + slug;
        String cover = absoluteImage(resource.getCoverImage());
        String html = resourceHtml(resource.getTitle(), resource.getDescription(), url, cover);
        sendHtml(recipient, "Nouvelle ressource LesCracks : " + resource.getTitle(), html);
    }

    @Override
    public void sendBroadcast(String recipient, String subject, JsonNode body,
                              String firstName, String lastName) {
        String html = bodies.render(body, text -> text
                .replace("{{firstName}}", firstName == null ? "" : firstName)
                .replace("{{lastName}}", lastName == null ? "" : lastName)
                .replace("{{email}}", recipient));
        sendHtml(recipient, subject, wrapper(subject, html, NEWSLETTER_NOTE));
    }

    private SimpleMailMessage message(String recipient) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(from);
        message.setTo(recipient);
        return message;
    }

    private void sendHtml(String recipient, String subject, String html) {
        try {
            MimeMessage message = sender.createMimeMessage();
            message.setFrom(new InternetAddress(from));
            message.setRecipients(MimeMessage.RecipientType.TO, InternetAddress.parse(recipient));
            message.setSubject(subject);
            message.setContent(html, "text/html; charset=utf-8");
            sender.send(message);
        } catch (MessagingException exception) {
            throw new IllegalStateException("Impossible d'envoyer l'email.", exception);
        }
    }

    private String absoluteImage(String coverImage) {
        if (coverImage == null || coverImage.isBlank()) {
            return frontendUrl + "/preview.jpg";
        }
        if (coverImage.startsWith("http://") || coverImage.startsWith("https://")) {
            return coverImage;
        }
        if (coverImage.startsWith("/")) {
            return frontendUrl + coverImage;
        }
        return frontendUrl + "/" + coverImage;
    }

    private static final String FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
    private static final String NEWSLETTER_NOTE = "Tu reçois cet email parce que tu es abonné à la newsletter LesCracks. Une question ? Réponds simplement à ce message.";

    /**
     * The fixed LesCracks frame around every HTML email: a black band with the logo, a white
     * reading column, a quiet footer. Admins only write the body; the frame is not editable.
     * Light on purpose: a white body stays readable in every client, dark mode included.
     */
    private String wrapper(String title, String body, String note) {
        return """
                <!DOCTYPE html>
                <html lang="fr">
                <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <meta name="color-scheme" content="light">
                <meta name="supported-color-schemes" content="light">
                <title>%1$s</title>
                </head>
                <body style="margin:0;padding:0;background-color:#f4f4f2;">
                  <table role="presentation" width="100%%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f4f4f2;">
                    <tr>
                      <td align="center" style="padding:32px 16px 40px 16px;">
                        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;width:100%%;">
                          <tr>
                            <td style="background-color:#0b0b0b;padding:20px 40px;border-radius:4px 4px 0 0;">
                              <a href="%2$s" style="text-decoration:none;"><img src="%2$s/images/email-logo.png" width="74" height="30" alt="LesCracks" style="display:block;border:0;width:74px;height:30px;font-family:%3$s;font-size:18px;font-weight:700;color:#d4af37;" /></a>
                            </td>
                          </tr>
                          <tr>
                            <td style="background-color:#ffffff;padding:40px;border:1px solid #e6e6e3;border-top:0;border-radius:0 0 4px 4px;font-family:%3$s;font-size:16px;line-height:1.65;color:#262626;">
                              %4$s
                            </td>
                          </tr>
                          <tr>
                            <td style="padding:24px 40px 0 40px;font-family:%3$s;font-size:12px;line-height:1.6;color:#6b6b6b;">
                              <p style="margin:0 0 8px 0;">
                                <a href="%2$s" style="color:#262626;font-weight:600;text-decoration:none;">LesCracks</a>
                                <span style="color:#b5b5b5;">&nbsp;&middot;&nbsp;</span>
                                <a href="%2$s/ressources" style="color:#6b6b6b;text-decoration:none;">Ressources</a>
                                <span style="color:#b5b5b5;">&nbsp;&middot;&nbsp;</span>
                                <a href="%2$s/evenements" style="color:#6b6b6b;text-decoration:none;">Événements</a>
                              </p>
                              <p style="margin:0;">%5$s</p>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </body>
                </html>
                """.formatted(escapeHtml(title), frontendUrl, FONT, body, note);
    }

    private String heading(String text) {
        return "<h1 style=\"margin:0 0 16px 0;font-size:24px;line-height:1.3;font-weight:700;color:#0b0b0b;\">" + text + "</h1>";
    }

    private String paragraph(String text) {
        return "<p style=\"margin:0 0 20px 0;font-size:16px;line-height:1.65;color:#262626;\">" + text + "</p>";
    }

    private String cover(String url, String alt) {
        return "<img src=\"" + url + "\" alt=\"" + alt + "\" width=\"518\" style=\"display:block;width:100%;max-width:518px;height:auto;border:0;border-radius:4px;margin:0 0 24px 0;\" />";
    }

    private String button(String label, String url) {
        return """
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:8px 0 28px 0;">
                  <tr>
                    <td style="background-color:#d4af37;border-radius:4px;">
                      <a href="%s" style="display:inline-block;padding:13px 24px;font-size:15px;font-weight:600;color:#0b0b0b;text-decoration:none;">%s</a>
                    </td>
                  </tr>
                </table>
                """.formatted(url, label);
    }

    private String fallbackLink(String label, String url) {
        return "<p style=\"margin:0;font-size:13px;line-height:1.6;color:#6b6b6b;word-break:break-all;\">" + label
                + " <a href=\"" + url + "\" style=\"color:#8a6d10;\">" + url + "</a></p>";
    }

    private String resourceHtml(String title, String description, String url, String cover) {
        String escapedTitle = escapeHtml(title);
        return wrapper(title, heading(escapedTitle) + cover(cover, escapedTitle) + paragraph(escapeHtml(description))
                + button("Découvrir la ressource", url) + fallbackLink("Ou ouvre ce lien :", url), NEWSLETTER_NOTE);
    }

    private String eventHtml(String title, String description, String url, String cover, java.time.Instant startDate) {
        String escapedTitle = escapeHtml(title);
        String date = startDate == null ? "" : paragraph("<strong style=\"color:#0b0b0b;\">"
                + escapeHtml(DateTimeFormatter.ofPattern("EEEE d MMMM 'à' HH'h'mm", Locale.FRANCE)
                        .format(startDate.atZone(ZoneId.of("Europe/Paris"))))
                + "</strong>");
        return wrapper(title, heading(escapedTitle) + cover(cover, escapedTitle) + date + paragraph(escapeHtml(description))
                + button("Voir l'événement", url) + fallbackLink("Ou ouvre ce lien :", url), NEWSLETTER_NOTE);
    }

    private String verificationHtml(String firstName, String email, String token) {
        String link = frontendUrl + "/verifier-email?token=" + token;
        String greeting = firstName.isBlank() ? "Bonjour," : "Bonjour " + escapeHtml(firstName) + ",";
        return wrapper("Confirme ton adresse email", heading("Confirme ton adresse email")
                + paragraph(greeting)
                + paragraph("Pour activer ton compte LesCracks, confirme ton adresse en cliquant sur le bouton ci-dessous.")
                + button("Confirmer mon adresse", link)
                + paragraph("<span style=\"font-size:14px;color:#6b6b6b;\">Ce lien expire dans 24 heures.</span>")
                + fallbackLink("Si le bouton ne fonctionne pas, ouvre ce lien :", link),
                "Tu reçois cet email parce qu'un compte LesCracks a été créé avec cette adresse. Si ce n'est pas toi, ignore simplement ce message.");
    }

    private String escapeHtml(String value) {
        return value.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;");
    }
}
