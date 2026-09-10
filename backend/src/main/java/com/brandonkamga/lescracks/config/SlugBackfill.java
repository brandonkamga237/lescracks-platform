package com.brandonkamga.lescracks.config;

import com.brandonkamga.lescracks.repository.EventRepository;
import com.brandonkamga.lescracks.repository.ResourceRepository;
import com.brandonkamga.lescracks.util.Slugs;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class SlugBackfill implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(SlugBackfill.class);

    private final ResourceRepository resources;
    private final EventRepository events;

    public SlugBackfill(ResourceRepository resources, EventRepository events) {
        this.resources = resources;
        this.events = events;
    }

    @Override
    @Transactional
    public void run(String... args) {
        resources.findAll().stream()
                .filter(resource -> resource.getSlug() == null || resource.getSlug().isBlank())
                .forEach(resource -> {
                    resource.setSlug(Slugs.uniqueFrom(resource.getTitle(), resources::existsBySlug));
                    resources.save(resource);
                });

        events.findAll().stream()
                .filter(event -> event.getSlug() == null || event.getSlug().isBlank())
                .forEach(event -> {
                    event.setSlug(Slugs.uniqueFrom(event.getTitle(), events::existsBySlug));
                    events.save(event);
                });

        log.info("Slug backfill completed");
    }
}
