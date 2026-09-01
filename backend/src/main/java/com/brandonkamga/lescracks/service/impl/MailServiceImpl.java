package com.brandonkamga.lescracks.service.impl;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import jakarta.mail.internet.MimeMessage;

@Service
public class MailServiceImpl {

    private static final Logger log = LoggerFactory.getLogger(MailServiceImpl.class);

    private final JavaMailSender mailSender;
    private final String from;
    private final String frontendUrl;

    public MailServiceImpl(
            JavaMailSender mailSender,
            @Value("${app.mail.from:LesCracks <contact@lescracks.com>}") String from,
            @Value("${app.frontend.url:http://localhost:5173}") String frontendUrl) {
        this.mailSender = mailSender;
        this.from = from;
        this.frontendUrl = frontendUrl;
    }

    @Async
    public void sendPasswordReset(String to, String token) {
        String resetLink = frontendUrl + "/reset-password?token=" + token;
        String html = """
            <!DOCTYPE html>
            <html lang="fr">
            <head><meta charset="UTF-8"></head>
            <body style="margin:0;padding:0;background:#0a0a0a;font-family:'Segoe UI',Arial,sans-serif;">
              <table width="100%%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 0;">
                <tr><td align="center">
                  <table width="560" cellpadding="0" cellspacing="0" style="background:#111;border:1px solid #222;border-radius:16px;overflow:hidden;">
                    <!-- Header -->
                    <tr>
                      <td style="background:#0a0a0a;padding:32px 40px;border-bottom:1px solid #222;">
                        <span style="color:#C9A84C;font-size:22px;font-weight:700;letter-spacing:1px;">Les<span style="color:#fff;">Cracks</span></span>
                      </td>
                    </tr>
                    <!-- Body -->
                    <tr>
                      <td style="padding:40px;">
                        <h1 style="color:#fff;font-size:24px;font-weight:700;margin:0 0 12px;">Réinitialisation du mot de passe</h1>
                        <p style="color:#aaa;font-size:15px;line-height:1.6;margin:0 0 24px;">
                          Tu as demandé à réinitialiser ton mot de passe. Clique sur le bouton ci-dessous pour en choisir un nouveau.
                          Ce lien est valable <strong style="color:#fff;">30 minutes</strong>.
                        </p>
                        <table cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
                          <tr>
                            <td style="background:#C9A84C;border-radius:10px;">
                              <a href="%s" style="display:inline-block;padding:14px 32px;color:#000;font-size:15px;font-weight:700;text-decoration:none;">
                                Réinitialiser mon mot de passe
                              </a>
                            </td>
                          </tr>
                        </table>
                        <p style="color:#666;font-size:13px;line-height:1.6;margin:0;">
                          Si tu n'as pas demandé cette réinitialisation, ignore cet email — ton mot de passe restera inchangé.
                        </p>
                      </td>
                    </tr>
                    <!-- Footer -->
                    <tr>
                      <td style="background:#0a0a0a;padding:24px 40px;border-top:1px solid #222;">
                        <p style="color:#555;font-size:12px;margin:0;">
                          © 2026 LesCracks · <a href="%s" style="color:#C9A84C;text-decoration:none;">lescracks.com</a>
                        </p>
                      </td>
                    </tr>
                  </table>
                </td></tr>
              </table>
            </body>
            </html>
            """.formatted(resetLink, frontendUrl);

        send(to, "Réinitialisation de ton mot de passe — LesCracks", html);
    }

    @Async
    public void sendWelcome(String to, String username) {
        String html = """
            <!DOCTYPE html>
            <html lang="fr">
            <head><meta charset="UTF-8"></head>
            <body style="margin:0;padding:0;background:#0a0a0a;font-family:'Segoe UI',Arial,sans-serif;">
              <table width="100%%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 0;">
                <tr><td align="center">
                  <table width="560" cellpadding="0" cellspacing="0" style="background:#111;border:1px solid #222;border-radius:16px;overflow:hidden;">
                    <tr>
                      <td style="background:#0a0a0a;padding:32px 40px;border-bottom:1px solid #222;">
                        <span style="color:#C9A84C;font-size:22px;font-weight:700;letter-spacing:1px;">Les<span style="color:#fff;">Cracks</span></span>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:40px;">
                        <h1 style="color:#fff;font-size:24px;font-weight:700;margin:0 0 12px;">Bienvenue, %s ! 🎉</h1>
                        <p style="color:#aaa;font-size:15px;line-height:1.6;margin:0 0 20px;">
                          Ton compte LesCracks est créé. Tu fais maintenant partie de la communauté des cracks de la tech.
                        </p>
                        <p style="color:#aaa;font-size:15px;line-height:1.6;margin:0 0 28px;">
                          Explore les ressources, postule à l'accompagnement 360, et rejoins les événements de la communauté.
                        </p>
                        <table cellpadding="0" cellspacing="0">
                          <tr>
                            <td style="background:#C9A84C;border-radius:10px;">
                              <a href="%s" style="display:inline-block;padding:14px 32px;color:#000;font-size:15px;font-weight:700;text-decoration:none;">
                                Accéder à la plateforme
                              </a>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    <tr>
                      <td style="background:#0a0a0a;padding:24px 40px;border-top:1px solid #222;">
                        <p style="color:#555;font-size:12px;margin:0;">
                          © 2026 LesCracks · <a href="%s" style="color:#C9A84C;text-decoration:none;">lescracks.com</a>
                        </p>
                      </td>
                    </tr>
                  </table>
                </td></tr>
              </table>
            </body>
            </html>
            """.formatted(username, frontendUrl, frontendUrl);

        send(to, "Bienvenue sur LesCracks 🚀", html);
    }






    @Async
    public void sendEmailVerification(String to, String username, String token) {
        String verifyLink = frontendUrl + "/verify-email?token=" + token;
        String html = """
            <!DOCTYPE html>
            <html lang="fr">
            <head><meta charset="UTF-8"></head>
            <body style="margin:0;padding:0;background:#0a0a0a;font-family:'Segoe UI',Arial,sans-serif;">
              <table width="100%%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 0;">
                <tr><td align="center">
                  <table width="560" cellpadding="0" cellspacing="0" style="background:#111;border:1px solid #222;border-radius:16px;overflow:hidden;">
                    <tr>
                      <td style="background:#0a0a0a;padding:32px 40px;border-bottom:1px solid #222;">
                        <span style="color:#C9A84C;font-size:22px;font-weight:700;letter-spacing:1px;">Les<span style="color:#fff;">Cracks</span></span>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:40px;">
                        <h1 style="color:#fff;font-size:24px;font-weight:700;margin:0 0 12px;">Confirme ton adresse email</h1>
                        <p style="color:#aaa;font-size:15px;line-height:1.6;margin:0 0 8px;">
                          Salut <strong style="color:#fff;">%s</strong> 👋
                        </p>
                        <p style="color:#aaa;font-size:15px;line-height:1.6;margin:0 0 28px;">
                          Une dernière étape — clique sur le bouton ci-dessous pour confirmer ton adresse et activer ton compte LesCracks.
                          Ce lien est valable <strong style="color:#fff;">24 heures</strong>.
                        </p>
                        <table cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
                          <tr>
                            <td style="background:#C9A84C;border-radius:10px;">
                              <a href="%s" style="display:inline-block;padding:14px 32px;color:#000;font-size:15px;font-weight:700;text-decoration:none;">
                                Confirmer mon email
                              </a>
                            </td>
                          </tr>
                        </table>
                        <p style="color:#555;font-size:13px;line-height:1.6;margin:0;">
                          Si tu n'as pas créé de compte, ignore cet email.
                        </p>
                      </td>
                    </tr>
                    <tr>
                      <td style="background:#0a0a0a;padding:24px 40px;border-top:1px solid #222;">
                        <p style="color:#555;font-size:12px;margin:0;">
                          © 2026 LesCracks · <a href="%s" style="color:#C9A84C;text-decoration:none;">lescracks.com</a>
                        </p>
                      </td>
                    </tr>
                  </table>
                </td></tr>
              </table>
            </body>
            </html>
            """.formatted(username, verifyLink, frontendUrl);

        send(to, "Confirme ton adresse email — LesCracks", html);
    }

    @Async
    public void sendApplicationAccepted(String to, String fullName, String whatsapp) {
        String html = """
            <!DOCTYPE html>
            <html lang="fr">
            <head><meta charset="UTF-8"></head>
            <body style="margin:0;padding:0;background:#0a0a0a;font-family:'Segoe UI',Arial,sans-serif;">
              <table width="100%%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 0;">
                <tr><td align="center">
                  <table width="560" cellpadding="0" cellspacing="0" style="background:#111;border:1px solid #222;border-radius:16px;overflow:hidden;">
                    <tr>
                      <td style="background:linear-gradient(135deg,#1a1400,#0a0a0a);padding:32px 40px;border-bottom:1px solid #333;">
                        <span style="color:#C9A84C;font-size:22px;font-weight:700;letter-spacing:1px;">Les<span style="color:#fff;">Cracks</span></span>
                        <span style="background:#22c55e;color:#fff;font-size:11px;font-weight:700;padding:3px 10px;border-radius:20px;margin-left:12px;letter-spacing:1px;">ACCEPTÉ</span>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:40px;">
                        <h1 style="color:#22c55e;font-size:26px;font-weight:700;margin:0 0 12px;">Félicitations, ta candidature est acceptée ! 🎉</h1>
                        <p style="color:#aaa;font-size:15px;line-height:1.6;margin:0 0 20px;">
                          Bonjour <strong style="color:#fff;">%s</strong>,
                        </p>
                        <p style="color:#aaa;font-size:15px;line-height:1.6;margin:0 0 20px;">
                          Nous avons le plaisir de t'informer que ta candidature pour l'<strong style="color:#C9A84C;">Accompagnement 360</strong> a été <strong style="color:#22c55e;">acceptée</strong>.
                        </p>
                        <div style="background:#0d1f0d;border:1px solid #166534;border-radius:12px;padding:20px 24px;margin:0 0 24px;">
                          <p style="color:#86efac;font-size:14px;font-weight:600;margin:0 0 8px;">📱 Prochaine étape</p>
                          <p style="color:#aaa;font-size:14px;line-height:1.6;margin:0;">
                            Notre équipe va te contacter <strong style="color:#fff;">prochainement sur WhatsApp</strong> via le numéro que tu as renseigné dans ton formulaire :
                          </p>
                          <p style="color:#C9A84C;font-size:16px;font-weight:700;margin:12px 0 0;">%s</p>
                        </div>
                        <p style="color:#aaa;font-size:14px;line-height:1.6;margin:0;">
                          Assure-toi d'être disponible sur ce numéro. On a hâte de commencer ce parcours avec toi.
                        </p>
                      </td>
                    </tr>
                    <tr>
                      <td style="background:#0a0a0a;padding:24px 40px;border-top:1px solid #222;">
                        <p style="color:#555;font-size:12px;margin:0;">
                          © 2026 LesCracks · <a href="%s" style="color:#C9A84C;text-decoration:none;">lescracks.com</a>
                        </p>
                      </td>
                    </tr>
                  </table>
                </td></tr>
              </table>
            </body>
            </html>
            """.formatted(fullName, whatsapp != null ? whatsapp : "non renseigné", frontendUrl);

        send(to, "Ta candidature Accompagnement 360 est acceptée ! 🎉 — LesCracks", html);
    }

    /**
     * Send, and make a failure impossible to miss.
     *
     * These calls are @Async, so throwing here would only kill a pool thread — the caller
     * has already returned "Compte créé ! Vérifie ta boîte mail". That is the trap: when
     * SMTP is down we tell someone to go and check an inbox that will never receive
     * anything, and (until the resend endpoint existed) they were then locked out for good.
     *
     * We still don't throw — a broken mail server must not take registration down with it —
     * but the failure now lands in the real logs at ERROR with the stack trace, instead of
     * a System.err line nobody reads. If verification mails stop arriving, this is where it
     * says so.
     */
    private void send(String to, String subject, String html) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(from);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(html, true);
            mailSender.send(message);
            log.info("Mail envoyé à {} — sujet: {}", to, subject);
        } catch (Exception e) {
            log.error("ÉCHEC d'envoi du mail à {} — sujet: {}. "
                    + "L'utilisateur a pu recevoir une confirmation sans jamais recevoir le mail.",
                    to, subject, e);
        }
    }
}
