package com.brandonkamga.lescracks.service.impl;

import com.brandonkamga.lescracks.domain.Mentorship;
import com.brandonkamga.lescracks.repository.MentorshipRepository;
import com.brandonkamga.lescracks.service.interfaces.MediaService;
import com.brandonkamga.lescracks.service.interfaces.MentorshipService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
@Transactional
public class MentorshipServiceImpl implements MentorshipService {

    private static final Logger log = LoggerFactory.getLogger(MentorshipServiceImpl.class);

    private final MentorshipRepository repository;
    private final MediaService media;

    public MentorshipServiceImpl(MentorshipRepository repository, MediaService media) {
        this.repository = repository;
        this.media = media;
    }

    @Override
    @Transactional(readOnly = true)
    public Mentorship current() {
        // The row is created by the schema, so a missing one means the migration did not run.
        return repository.findById(Mentorship.SINGLETON_ID)
                .orElseThrow(() -> new IllegalStateException(
                        "The mentorship row is missing; the schema was not applied"));
    }

    @Override
    public Mentorship setOpen(boolean open) {
        Mentorship mentorship = current();
        if (mentorship.isOpen() == open) {
            return mentorship;
        }
        mentorship.setOpen(open);
        mentorship.setUpdatedAt(Instant.now());
        log.info("Accompagnement 360 is now {}", open ? "open" : "closed");
        return mentorship;
    }

    @Override
    public Mentorship update(String title, String summary, String description, Long coverId) {
        Mentorship mentorship = current();
        mentorship.setTitle(title);
        mentorship.setSummary(summary);
        mentorship.setDescription(description);
        mentorship.setCover(coverId == null ? null : media.require(coverId));
        mentorship.setUpdatedAt(Instant.now());
        return mentorship;
    }

    @Override
    @Transactional(readOnly = true)
    public boolean isOpen() {
        return current().isOpen();
    }
}
