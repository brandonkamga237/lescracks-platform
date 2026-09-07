package com.brandonkamga.lescracks.service.impl;

import com.brandonkamga.lescracks.service.interfaces.MailService;
import com.brandonkamga.lescracks.domain.Event;
import com.brandonkamga.lescracks.domain.Resource;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class MailServiceImpl implements MailService {
    private final JavaMailSender sender;
    private final String frontendUrl;

    public MailServiceImpl(JavaMailSender sender,
                           @Value("${app.site.url:http://localhost:5173}") String frontendUrl) {
        this.sender = sender;
        this.frontendUrl = frontendUrl;
    }

    @Override
    public void sendPasswordReset(String recipient, String token) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(recipient);
        message.setSubject("Réinitialisation de votre mot de passe LesCracks");
        message.setText("Réinitialisez votre mot de passe ici : "
                + frontendUrl + "/reset-password?token=" + token
                + "\n\nCe lien expire dans 30 minutes.");
        sender.send(message);
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

    private void send(String recipient, String subject, String text) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(recipient);
        message.setSubject(subject);
        message.setText(text);
        sender.send(message);
    }
}