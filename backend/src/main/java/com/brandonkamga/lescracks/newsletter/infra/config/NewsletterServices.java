package com.brandonkamga.lescracks.newsletter.infra.config;

import com.brandonkamga.lescracks.account.application.AccountDirectory;
import com.brandonkamga.lescracks.newsletter.application.Announcements;
import com.brandonkamga.lescracks.newsletter.application.AnnouncementsImpl;
import com.brandonkamga.lescracks.newsletter.application.NewsletterAdminService;
import com.brandonkamga.lescracks.newsletter.application.NewsletterAdminServiceImpl;
import com.brandonkamga.lescracks.newsletter.application.NewsletterService;
import com.brandonkamga.lescracks.newsletter.application.NewsletterServiceImpl;
import com.brandonkamga.lescracks.newsletter.domain.port.CampaignStore;
import com.brandonkamga.lescracks.newsletter.domain.port.SubscriberStore;
import com.brandonkamga.lescracks.mail.domain.Mailer;
import com.brandonkamga.lescracks.shared.config.TransactionalServices;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/** Builds the newsletter's use cases from their ports and adapters, each inside its transaction. */
@Configuration
public class NewsletterServices {

    private final TransactionalServices transactional;

    public NewsletterServices(TransactionalServices transactional) {
        this.transactional = transactional;
    }

    @Bean
    NewsletterService newsletterService(SubscriberStore subscribers, AccountDirectory accounts, Mailer mail) {
        return transactional.wrap(NewsletterService.class, new NewsletterServiceImpl(subscribers, accounts, mail));
    }

    @Bean
    NewsletterAdminService newsletterAdminService(SubscriberStore subscribers, CampaignStore campaigns, Mailer mail) {
        return transactional.wrap(NewsletterAdminService.class, new NewsletterAdminServiceImpl(subscribers, campaigns, mail));
    }

    @Bean
    Announcements announcements(SubscriberStore subscribers, Mailer mail) {
        return transactional.wrap(Announcements.class, new AnnouncementsImpl(subscribers, mail));
    }
}
