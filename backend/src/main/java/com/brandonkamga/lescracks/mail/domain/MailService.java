package com.brandonkamga.lescracks.mail.domain;

import com.brandonkamga.lescracks.event.domain.Event;
import com.brandonkamga.lescracks.resource.domain.Resource;

public interface MailService {
    void sendPasswordReset(String recipient, String token);

    void sendVerificationEmail(String recipient, String token, String firstName);

    void sendEventNotification(String recipient, Event event);

    void sendResourceNotification(String recipient, Resource resource);

    void sendBroadcast(String recipient, String subject, String message, String firstName,
                       String lastName);
}
