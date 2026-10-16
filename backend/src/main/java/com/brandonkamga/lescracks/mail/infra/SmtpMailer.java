package com.brandonkamga.lescracks.mail.infra;

import com.brandonkamga.lescracks.mail.domain.Email;
import com.brandonkamga.lescracks.mail.domain.Mailer;

import jakarta.annotation.PreDestroy;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.util.concurrent.Executor;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

/**
 * Emails leave once the caller's transaction has committed, on one background thread.
 *
 * Sending inside the transaction meant a slow or failing SMTP server made the request slow or
 * rolled it back: a sign-up was lost because its welcome email could not go out. Now the
 * account exists whatever the mail server does, and an email is never sent for a change that
 * was rolled back. A single thread also keeps a newsletter from opening dozens of SMTP
 * connections at once, which mailbox providers throttle.
 */
@Service
public class SmtpMailer implements Mailer {
    private static final Logger log = LoggerFactory.getLogger(SmtpMailer.class);

    private final JavaMailSender sender;
    private final EmailTemplates templates;
    private final String from;
    private final Executor delivery;

    @Autowired
    public SmtpMailer(JavaMailSender sender, EmailTemplates templates,
                      @Value("${app.mail.from:LesCracks <contact@lescracks.com>}") String from) {
        this(sender, templates, from, Executors.newSingleThreadExecutor(task -> {
            Thread thread = new Thread(task, "mail-delivery");
            thread.setDaemon(true);
            return thread;
        }));
    }

    SmtpMailer(JavaMailSender sender, EmailTemplates templates, String from, Executor delivery) {
        this.sender = sender;
        this.templates = templates;
        this.from = from;
        this.delivery = delivery;
    }

    @Override
    public void send(Email email) {
        // Rendered now, on the caller's thread: the data is still loaded, and a template bug
        // surfaces in the request instead of disappearing in a background log.
        RenderedEmail rendered = templates.render(email);
        Runnable task = () -> deliver(email, rendered);
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    delivery.execute(task);
                }
            });
        } else {
            delivery.execute(task);
        }
    }

    @Override
    public String previewHtml(Email email) {
        return templates.render(email).html();
    }

    private void deliver(Email email, RenderedEmail rendered) {
        try {
            MimeMessage message = sender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, "UTF-8");
            helper.setFrom(from);
            helper.setTo(email.to());
            helper.setSubject(rendered.subject());
            helper.setText(rendered.html(), true);
            sender.send(message);
        } catch (MessagingException | RuntimeException failure) {
            log.error("{} not delivered", email.getClass().getSimpleName(), failure);
        }
    }

    /** Lets queued emails go out before the application stops. */
    @PreDestroy
    void drain() throws InterruptedException {
        if (delivery instanceof ExecutorService executor) {
            executor.shutdown();
            executor.awaitTermination(30, TimeUnit.SECONDS);
        }
    }
}
