package com.brandonkamga.lescracks.service.impl;

import com.brandonkamga.lescracks.service.interfaces.MailService;
import com.brandonkamga.lescracks.domain.Event;
import com.brandonkamga.lescracks.domain.Resource;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class MailServiceImpl implements MailService {
    private final JavaMailSender sender;
    private final String frontendUrl;
    private final String from;

    public MailServiceImpl(JavaMailSender sender,
                           @Value("${app.site.url:http://localhost:5173}") String frontendUrl,
                           @Value("${app.mail.from:LesCracks <contact@lescracks.com>}") String from) {
        this.sender = sender;
        this.frontendUrl = frontendUrl;
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
        send(recipient, "Nouvel événement LesCracks : " + event.getTitle(),
                "Un nouvel événement est disponible :\n\n" + event.getTitle()
                        + "\n" + event.getDescription()
                        + "\n\nDate : " + event.getStartDate());
    }

    @Override
    public void sendResourceNotification(String recipient, Resource resource) {
        send(recipient, "Nouvelle ressource LesCracks : " + resource.getTitle(),
                "Une nouvelle ressource est disponible :\n\n" + resource.getTitle()
                        + "\n" + resource.getDescription());
    }

    @Override
    public void sendBroadcast(String recipient, String subject, String message,
                              String firstName, String lastName) {
        String personalized = message.replace("{{firstName}}", firstName == null ? "" : firstName)
                .replace("{{lastName}}", lastName == null ? "" : lastName)
                .replace("{{email}}", recipient);
        send(recipient, subject, personalized);
    }

    private SimpleMailMessage message(String recipient) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(from);
        message.setTo(recipient);
        return message;
    }

    private void send(String recipient, String subject, String text) {
        SimpleMailMessage message = message(recipient);
        message.setSubject(subject);
        message.setText(text);
        sender.send(message);
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

    private String verificationHtml(String firstName, String email, String token) {
        String link = frontendUrl + "/verifier-email?token=" + token;
        String greeting = firstName.isBlank() ? "Bonjour," : "Bonjour " + escapeHtml(firstName) + ",";
        return """
                <!DOCTYPE html>
                <html lang="fr">
                <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
                <body style="margin:0;padding:0;background-color:#0f0f0f;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#e5e5e5;">
                  <table role="presentation" width="100%%" cellspacing="0" cellpadding="0" border="0" style="background-color:#0f0f0f;padding:40px 0;">
                    <tr>
                      <td align="center">
                        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="background-color:#171717;border-radius:16px;overflow:hidden;max-width:600px;width:100%%;">
                          <tr>
                            <td style="padding:40px 40px 24px 40px;text-align:center;border-bottom:1px solid #2a2a2a;">
                              <span style="color:#d4af37;font-size:14px;letter-spacing:0.15em;text-transform:uppercase;font-weight:600;">LesCracks</span>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding:40px;">
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
                            </td>
                          </tr>
                          <tr>
                            <td style="padding:24px 40px;text-align:center;background-color:#111111;border-top:1px solid #2a2a2a;">
                              <p style="margin:0;font-size:12px;color:#525252;">LesCracks — Deviens aussi un crack de la tech.</p>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </body>
                </html>
                """.formatted(greeting, link, link);
    }

    private String escapeHtml(String value) {
        return value.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;");
    }
}
