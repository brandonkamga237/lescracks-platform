package com.brandonkamga.lescracks.mail.infra;

import com.brandonkamga.lescracks.mail.domain.Email;
import com.brandonkamga.lescracks.mail.domain.Mailer;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
public class SmtpMailer implements Mailer {
    private final JavaMailSender sender;
    private final EmailTemplates templates;
    private final String from;

    public SmtpMailer(JavaMailSender sender, EmailTemplates templates,
                      @Value("${app.mail.from:LesCracks <contact@lescracks.com>}") String from) {
        this.sender = sender;
        this.templates = templates;
        this.from = from;
    }

    @Override
    public void send(Email email) {
        deliver(email.to(), templates.render(email));
    }

    @Override
    public String previewHtml(Email email) {
        return templates.render(email).html();
    }

    private void deliver(String to, RenderedEmail rendered) {
        try {
            MimeMessage message = sender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, "UTF-8");
            helper.setFrom(from);
            helper.setTo(to);
            helper.setSubject(rendered.subject());
            helper.setText(rendered.html(), true);
            sender.send(message);
        } catch (MessagingException exception) {
            throw new IllegalStateException("Impossible d'envoyer l'email.", exception);
        }
    }
}
