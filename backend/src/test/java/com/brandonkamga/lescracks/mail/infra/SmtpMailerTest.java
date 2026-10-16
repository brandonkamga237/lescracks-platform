package com.brandonkamga.lescracks.mail.infra;

import com.brandonkamga.lescracks.mail.domain.PasswordResetEmail;

import jakarta.mail.Session;
import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.mail.MailSendException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Properties;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class SmtpMailerTest {

    private final JavaMailSender sender = mock(JavaMailSender.class);
    private final EmailLayout layout = new EmailLayout("https://lescracks.com");
    private final SmtpMailer mailer = new SmtpMailer(sender,
            new EmailTemplates(List.of(new PasswordResetEmailTemplate(layout))), "LesCracks <contact@lescracks.com>", Runnable::run);

    @BeforeEach
    void setUp() {
        when(sender.createMimeMessage()).thenAnswer(invocation -> new MimeMessage(Session.getInstance(new Properties())));
    }

    @AfterEach
    void tearDown() {
        if (TransactionSynchronizationManager.isSynchronizationActive()) TransactionSynchronizationManager.clearSynchronization();
    }

    @Test
    @DisplayName("inside a transaction, nothing leaves before the commit")
    void waitsForTheCommit() {
        TransactionSynchronizationManager.initSynchronization();

        mailer.send(new PasswordResetEmail("awa@example.com", "token"));
        verify(sender, never()).send(any(MimeMessage.class));

        TransactionSynchronizationManager.getSynchronizations().forEach(TransactionSynchronization::afterCommit);
        verify(sender).send(any(MimeMessage.class));
    }

    @Test
    @DisplayName("every email carries a plain-text part next to its HTML")
    void sendsBothParts() throws Exception {
        ArgumentCaptor<MimeMessage> sent = ArgumentCaptor.forClass(MimeMessage.class);

        mailer.send(new PasswordResetEmail("awa@example.com", "token"));

        verify(sender).send(sent.capture());
        MimeMessage message = sent.getValue();
        message.saveChanges();
        ByteArrayOutputStream raw = new ByteArrayOutputStream();
        message.writeTo(raw);
        assertThat(raw.toString(StandardCharsets.UTF_8))
                .contains("multipart/alternative", "text/plain", "text/html");
    }

    @Test
    @DisplayName("a rolled-back transaction sends nothing")
    void rollbackSendsNothing() {
        TransactionSynchronizationManager.initSynchronization();

        mailer.send(new PasswordResetEmail("awa@example.com", "token"));
        TransactionSynchronizationManager.getSynchronizations()
                .forEach(sync -> sync.afterCompletion(TransactionSynchronization.STATUS_ROLLED_BACK));

        verify(sender, never()).send(any(MimeMessage.class));
    }

    @Test
    @DisplayName("an SMTP failure is logged, never thrown at the caller")
    void failureStaysInTheMailer() {
        doThrow(new MailSendException("connection refused")).when(sender).send(any(MimeMessage.class));

        assertThatCode(() -> mailer.send(new PasswordResetEmail("awa@example.com", "token"))).doesNotThrowAnyException();
    }
}
