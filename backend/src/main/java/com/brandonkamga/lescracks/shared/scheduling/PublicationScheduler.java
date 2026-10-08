package com.brandonkamga.lescracks.shared.scheduling;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.util.ClassUtils;

import java.time.Instant;
import java.util.List;

/** Every minute, publishes the drafts whose date has come, one at a time so one failure never blocks the rest. */
@Component
@ConditionalOnProperty(name = "app.scheduled-publication.enabled", havingValue = "true", matchIfMissing = true)
public class PublicationScheduler {

    private static final Logger log = LoggerFactory.getLogger(PublicationScheduler.class);

    private final List<ScheduledPublishing> publishers;

    public PublicationScheduler(List<ScheduledPublishing> publishers) {
        this.publishers = publishers;
    }

    @Scheduled(fixedDelay = 60_000, initialDelay = 30_000)
    public void run() {
        publishDue(Instant.now());
    }

    public int publishDue(Instant now) {
        int published = 0;
        for (ScheduledPublishing publisher : publishers) {
            for (Long id : publisher.dueForPublication(now)) {
                String what = ClassUtils.getUserClass(publisher).getSimpleName() + " #" + id;
                try {
                    if (!publisher.publishScheduled(id, now)) continue;
                } catch (RuntimeException exception) {
                    log.error("Scheduled publication failed for {}", what, exception);
                    continue;
                }
                published++;
                log.info("Published on schedule: {}", what);
                try {
                    publisher.announce(id);
                } catch (RuntimeException exception) {
                    log.error("Published {} but its announcement failed", what, exception);
                }
            }
        }
        return published;
    }
}
