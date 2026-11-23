package com.brandonkamga.lescracks.event.infra.scheduling;

import com.brandonkamga.lescracks.event.application.RendezVousReminders;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Instant;

/** Every minute, sends the rendez-vous reminders whose moment has come. */
@Component
@ConditionalOnProperty(name = "app.rendez-vous-reminders.enabled", havingValue = "true", matchIfMissing = true)
class RendezVousReminderScheduler {

    private static final Logger log = LoggerFactory.getLogger(RendezVousReminderScheduler.class);

    private final RendezVousReminders reminders;

    RendezVousReminderScheduler(RendezVousReminders reminders) {
        this.reminders = reminders;
    }

    @Scheduled(fixedDelay = 60_000, initialDelay = 45_000)
    void run() {
        try {
            int sent = reminders.sendDue(Instant.now());
            if (sent > 0) log.info("Rendez-vous reminders sent: {}", sent);
        } catch (RuntimeException exception) {
            // Nothing was marked as sent: the next run tries the same reminders again.
            log.error("Rendez-vous reminders failed", exception);
        }
    }
}
