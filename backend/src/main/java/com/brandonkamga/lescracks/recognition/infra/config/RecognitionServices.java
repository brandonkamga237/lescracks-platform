package com.brandonkamga.lescracks.recognition.infra.config;

import com.brandonkamga.lescracks.recognition.application.BadgeRules;
import com.brandonkamga.lescracks.recognition.application.BadgeService;
import com.brandonkamga.lescracks.recognition.application.BadgeServiceImpl;
import com.brandonkamga.lescracks.recognition.application.CertificateService;
import com.brandonkamga.lescracks.recognition.application.CertificateServiceImpl;
import com.brandonkamga.lescracks.recognition.domain.port.AwardStore;
import com.brandonkamga.lescracks.recognition.domain.port.BadgeStore;
import com.brandonkamga.lescracks.recognition.domain.port.CertificateStore;
import com.brandonkamga.lescracks.recognition.domain.port.RecognitionEvents;
import com.brandonkamga.lescracks.event.application.EventDirectory;
import com.brandonkamga.lescracks.event.application.RegistrationService;
import com.brandonkamga.lescracks.event.application.SubmissionService;
import com.brandonkamga.lescracks.mail.domain.Mailer;
import com.brandonkamga.lescracks.member.application.MemberDirectory;
import com.brandonkamga.lescracks.shared.config.TransactionalServices;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/** Builds recognition's use cases from their ports and adapters, each inside its transaction. */
@Configuration
public class RecognitionServices {

    private final TransactionalServices transactional;

    public RecognitionServices(TransactionalServices transactional) {
        this.transactional = transactional;
    }

    @Bean
    BadgeService badgeService(BadgeStore badges, AwardStore awards, MemberDirectory people, RegistrationService registrations,
                              Mailer mailer) {
        return transactional.wrap(BadgeService.class, new BadgeServiceImpl(badges, awards, people, registrations, mailer));
    }

    @Bean
    BadgeRules badgeRules(BadgeService badges, EventDirectory events) {
        return new BadgeRules(badges, events);
    }

    @Bean
    CertificateService certificateService(CertificateStore certificates, EventDirectory events, RegistrationService registrations,
                                          SubmissionService submissions, MemberDirectory people, Mailer mailer,
                                          RecognitionEvents published) {
        return transactional.wrap(CertificateService.class,
                new CertificateServiceImpl(certificates, events, registrations, submissions, people, mailer, published));
    }
}
