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
        sendHtml(recipient, subject, wrapper(html));
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
            return frontendUrl + "/preview.png";
        }
        if (coverImage.startsWith("http://") || coverImage.startsWith("https://")) {
            return coverImage;
        }
        if (coverImage.startsWith("/")) {
            return frontendUrl + coverImage;
        }
        return frontendUrl + "/" + coverImage;
    }

    /**
     * The fixed LesCracks frame. Every email — broadcast, notification, verification — is this
     * envelope with a different body slot. Admins never touch it: identity is not personalisable.
     */
    private String wrapper(String body) {
        return """
                <!DOCTYPE html>
                <html lang="fr">
                <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
                <body style="margin:0;padding:0;background-color:#0a0a0a;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#e5e5e5;">
                  <table role="presentation" width="100%%" cellspacing="0" cellpadding="0" border="0" style="background-color:#0a0a0a;padding:48px 16px;">
                    <tr>
                      <td align="center">
                        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="background-color:#141414;border-radius:20px;overflow:hidden;max-width:600px;width:100%%;">
                          <tr>
                            <td style="height:3px;background-color:#d4af37;font-size:0;line-height:0;">&nbsp;</td>
                          </tr>
                          <tr>
                            <td style="padding:36px 48px 28px 48px;text-align:center;">
                              <p style="margin:0;color:#d4af37;font-size:22px;letter-spacing:0.22em;text-transform:uppercase;font-weight:700;">LesCracks</p>
                              <p style="margin:10px 0 0 0;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#737373;">Ressources · Événements · Communauté</p>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding:8px 48px 48px 48px;">
                              %s
                            </td>
                          </tr>
                          <tr>
                            <td style="padding:28px 48px;text-align:center;background-color:#101010;border-top:1px solid #262626;">
                              <p style="margin:0 0 14px 0;">
                                <a href="%s" style="color:#d4af37;font-size:12px;font-weight:600;letter-spacing:0.06em;text-decoration:none;text-transform:uppercase;">lescracks.com</a>
                                <span style="color:#3f3f3f;font-size:12px;">&nbsp;·&nbsp;</span>
                                <a href="%s/evenements" style="color:#a3a3a3;font-size:12px;text-decoration:none;">Événements</a>
                                <span style="color:#3f3f3f;font-size:12px;">&nbsp;·&nbsp;</span>
                                <a href="%s/ressources" style="color:#a3a3a3;font-size:12px;text-decoration:none;">Ressources</a>
                              </p>
                              <p style="margin:0 0 14px 0;font-size:12px;font-style:italic;color:#d4af37;">Deviens aussi un crack de la tech.</p>
                              <p style="margin:0;font-size:11px;line-height:1.6;color:#525252;">
                                Tu reçois cet email parce que tu es inscrit à la lettre LesCracks.<br />
                                Une question ? Réponds directement à cet email — on lit tout.
                              </p>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </body>
                </html>
                """.formatted(body, frontendUrl, frontendUrl, frontendUrl);
    }

    private String resourceHtml(String title, String description, String url, String cover) {
        String escapedTitle = escapeHtml(title);
        String escapedDescription = escapeHtml(description);
        return wrapper("""
                <h1 style="margin:0 0 20px 0;font-size:24px;font-weight:600;color:#ffffff;">%s</h1>
                <img src="%s" alt="%s" style="display:block;width:100%%;max-width:520px;border-radius:12px;margin-bottom:24px;" />
                <p style="margin:0 0 24px 0;font-size:16px;line-height:1.6;color:#a1a1a1;">%s</p>
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 32px 0;">
                  <tr>
                    <td style="border-radius:12px;background-color:#d4af37;text-align:center;">
                      <a href="%s" style="display:inline-block;padding:16px 32px;font-size:16px;font-weight:600;color:#000000;text-decoration:none;border-radius:12px;">Découvrir la ressource</a>
                    </td>
                  </tr>
                </table>
                <p style="margin:0;font-size:13px;line-height:1.5;color:#525252;word-break:break-all;">Lien direct : %s</p>
                """.formatted(escapedTitle, cover, escapedTitle, escapedDescription, url, url));
    }

    private String eventHtml(String title, String description, String url, String cover, java.time.Instant startDate) {
        String escapedTitle = escapeHtml(title);
        String escapedDescription = escapeHtml(description);
        String date = startDate == null ? "" : "<p style=\"margin:0 0 24px 0;font-size:16px;line-height:1.6;color:#a1a1a1;\">"
                + "<strong style=\"color:#d4af37;\">Date :</strong> "
                + escapeHtml(DateTimeFormatter.ofPattern("EEEE d MMMM à HH:mm", Locale.FRANCE).format(startDate.atZone(ZoneId.of("Europe/Paris"))))
                + "</p>";
        return wrapper("""
                <h1 style="margin:0 0 20px 0;font-size:24px;font-weight:600;color:#ffffff;">%s</h1>
                <img src="%s" alt="%s" style="display:block;width:100%%;max-width:520px;border-radius:12px;margin-bottom:24px;" />
                <p style="margin:0 0 24px 0;font-size:16px;line-height:1.6;color:#a1a1a1;">%s</p>
                %s
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 32px 0;">
                  <tr>
                    <td style="border-radius:12px;background-color:#d4af37;text-align:center;">
                      <a href="%s" style="display:inline-block;padding:16px 32px;font-size:16px;font-weight:600;color:#000000;text-decoration:none;border-radius:12px;">Voir l'événement</a>
                    </td>
                  </tr>
                </table>
                <p style="margin:0;font-size:13px;line-height:1.5;color:#525252;word-break:break-all;">Lien direct : %s</p>
                """.formatted(escapedTitle, cover, escapedTitle, escapedDescription, date, url, url));
    }

    private String verificationHtml(String firstName, String email, String token) {
        String link = frontendUrl + "/verifier-email?token=" + token;
        String greeting = firstName.isBlank() ? "Bonjour," : "Bonjour " + escapeHtml(firstName) + ",";
        return wrapper("""
                <h1 style="margin:0 0 20px 0;font-size:24px;font-weight:600;color:#ffffff;">Confirme ton adresse email</h1>
                <p style="margin:0 0 24px 0;font-size:16px;line-height:1.6;color:#a1a1a1;">%s</p>
                <p style="margin:0 0 32px 0;font-size:16px;line-height:1.6;color:#a1a1a1;">Pour activer ton compte et accéder à toutes les ressources LesCracks, clique sur le bouton ci-dessous.</p>
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 32px 0;">
                  <tr>
                    <td style="border-radius:12px;background-color:#d4af37;text-align:center;">
                      <a href="%s" style="display:inline-block;padding:16px 32px;font-size:16px;font-weight:600;color:#000000;text-decoration:none;border-radius:12px;">Confirmer mon email</a>
                    </td>
                  </tr>
                </table>
                <p style="margin:0 0 16px 0;font-size:14px;line-height:1.5;color:#737373;">Ce lien expire dans 24 heures. Si tu n'as pas créé de compte LesCracks, ignore simplement cet email.</p>
                <p style="margin:0;font-size:13px;line-height:1.5;color:#525252;word-break:break-all;">Lien de secours : %s</p>
                """.formatted(greeting, link, link));
    }

    private String escapeHtml(String value) {
        return value.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;");
    }
}
