package com.brandonkamga.lescracks.service.impl;

import com.brandonkamga.lescracks.domain.Application;
import com.brandonkamga.lescracks.domain.ApplicationStatus;
import com.brandonkamga.lescracks.domain.EnrolmentTarget;
import com.brandonkamga.lescracks.domain.Event;
import com.brandonkamga.lescracks.exception.BadRequestException;
import com.brandonkamga.lescracks.exception.NotFoundException;
import com.brandonkamga.lescracks.repository.ApplicationRepository;
import com.brandonkamga.lescracks.repository.UserRepository;
import com.brandonkamga.lescracks.service.interfaces.ApplicationService;
import com.brandonkamga.lescracks.service.interfaces.EventService;
import com.brandonkamga.lescracks.service.interfaces.MentorshipService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class ApplicationServiceImpl implements ApplicationService {

    private final ApplicationRepository applications;
    private final UserRepository users;
    private final EventService events;
    private final MentorshipService mentorship;

    public ApplicationServiceImpl(ApplicationRepository applications, UserRepository users,
                                  EventService events, MentorshipService mentorship) {
        this.applications = applications;
        this.users = users;
        this.events = events;
        this.mentorship = mentorship;
    }

    @Override
    public Application apply(ApplicationDraft draft) {
        validate(draft);
        Event event = resolveEvent(draft);
        refuseDuplicate(draft, event);

        Application application = Application.builder()
                .target(draft.target())
                .event(event)
                .fullName(draft.fullName().strip())
                .email(draft.email().strip().toLowerCase())
                .phone(draft.phone())
                .motivation(draft.motivation())
                .build();
        // Attach the account when the address already belongs to one, so the person finds
        // the application under their profile without doing anything.
        users.findByEmailIgnoreCase(application.getEmail()).ifPresent(application::setUser);
        return applications.save(application);
    }

    private void validate(ApplicationDraft draft) {
        if (draft.target() == null) {
            throw new BadRequestException("Précisez ce à quoi vous postulez.");
        }
        if (draft.fullName() == null || draft.fullName().isBlank()) {
            throw new BadRequestException("Votre nom est obligatoire.");
        }
        if (draft.email() == null || draft.email().isBlank()) {
            throw new BadRequestException("Votre email est obligatoire.");
        }
    }

    /** Resolves what is being applied for, and refuses if it is not taking anyone. */
    private Event resolveEvent(ApplicationDraft draft) {
        if (draft.target() == EnrolmentTarget.MENTORSHIP) {
            if (!mentorship.isOpen()) {
                throw new BadRequestException(
                        "Les candidatures à l'Accompagnement 360 sont fermées pour le moment.");
            }
            return null;
        }
        if (draft.eventId() == null) {
            throw new BadRequestException("Précisez l'événement concerné.");
        }
        Event event = events.require(draft.eventId());
        if (!event.isPublished()) {
            throw new BadRequestException("Cet événement n'accepte pas encore d'inscriptions.");
        }
        if (event.isPast()) {
            throw new BadRequestException("Cet événement est terminé.");
        }
        return event;
    }

    /** The database refuses this too; asking first turns a violation into a usable sentence. */
    private void refuseDuplicate(ApplicationDraft draft, Event event) {
        Long eventId = event == null ? null : event.getId();
        if (applications.hasPendingFor(draft.email(), draft.target(), eventId)) {
            throw new BadRequestException(
                    "Une candidature est déjà en cours d'examen pour cette adresse.");
        }
    }

    @Override
    @Transactional(readOnly = true)
    public Page<Application> byStatus(ApplicationStatus status, Pageable pageable) {
        return applications.findByStatusOrderByCreatedAtDesc(status, pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<Application> byTarget(EnrolmentTarget target, Pageable pageable) {
        return applications.findByTargetOrderByCreatedAtDesc(target, pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public Application require(Long id) {
        return applications.findById(id)
                .orElseThrow(() -> new NotFoundException("Application", "id", id));
    }

    @Override
    public Application decide(Long id, ApplicationStatus outcome) {
        Application application = require(id);
        if (!application.isPending()) {
            throw new BadRequestException("Cette candidature a déjà été traitée.");
        }
        application.decide(outcome);
        return application;
    }

    @Override
    @Transactional(readOnly = true)
    public long pendingCount() {
        return applications.countByStatus(ApplicationStatus.PENDING);
    }
}
