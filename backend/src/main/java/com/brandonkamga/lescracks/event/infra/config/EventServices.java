package com.brandonkamga.lescracks.event.infra.config;

import com.brandonkamga.lescracks.event.application.EventAdminService;
import com.brandonkamga.lescracks.event.application.EventAdminServiceImpl;
import com.brandonkamga.lescracks.event.application.EventCatalog;
import com.brandonkamga.lescracks.event.application.EventCatalogImpl;
import com.brandonkamga.lescracks.event.application.EventDirectory;
import com.brandonkamga.lescracks.event.application.EventSchedule;
import com.brandonkamga.lescracks.event.application.EventViews;
import com.brandonkamga.lescracks.event.application.RegistrationService;
import com.brandonkamga.lescracks.event.application.RegistrationServiceImpl;
import com.brandonkamga.lescracks.event.application.SubmissionService;
import com.brandonkamga.lescracks.event.application.SubmissionServiceImpl;
import com.brandonkamga.lescracks.event.domain.port.EventStore;
import com.brandonkamga.lescracks.event.domain.port.RegistrationStore;
import com.brandonkamga.lescracks.event.domain.port.SubmissionStore;
import com.brandonkamga.lescracks.engagement.application.EngagementCounts;
import com.brandonkamga.lescracks.member.application.MemberDirectory;
import com.brandonkamga.lescracks.newsletter.application.Announcements;
import com.brandonkamga.lescracks.shared.config.TransactionalServices;
import com.brandonkamga.lescracks.shared.scheduling.ScheduledPublishing;
import com.brandonkamga.lescracks.storage.domain.StorageService;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/** Builds event's use cases from their ports and adapters, each inside its transaction. */
@Configuration
public class EventServices {

    private final TransactionalServices transactional;

    public EventServices(TransactionalServices transactional) {
        this.transactional = transactional;
    }

    @Bean
    EventViews eventViews(EngagementCounts engagement) {
        return new EventViews(engagement);
    }

    @Bean
    EventCatalog eventCatalog(EventStore events, EventViews views) {
        return transactional.wrap(EventCatalog.class, new EventCatalogImpl(events, views));
    }

    @Bean
    EventDirectory eventDirectory(EventStore events, EventViews views) {
        return transactional.wrap(EventDirectory.class, new EventCatalogImpl(events, views));
    }

    @Bean
    EventAdminService eventAdminService(EventStore events, EventViews views, StorageService storage, Announcements announcements,
                                        EngagementCounts engagement) {
        return transactional.wrap(EventAdminService.class, new EventAdminServiceImpl(events, views, storage, announcements, engagement));
    }

    @Bean
    ScheduledPublishing eventSchedule(EventStore events, Announcements announcements) {
        return transactional.wrap(ScheduledPublishing.class, new EventSchedule(events, announcements));
    }

    @Bean
    RegistrationService registrationService(RegistrationStore registrations, EventStore events, MemberDirectory people) {
        return transactional.wrap(RegistrationService.class, new RegistrationServiceImpl(registrations, events, people));
    }

    @Bean
    SubmissionService submissionService(SubmissionStore submissions, EventStore events, RegistrationService registrations,
                                        MemberDirectory people) {
        return transactional.wrap(SubmissionService.class, new SubmissionServiceImpl(submissions, events, registrations, people));
    }
}
