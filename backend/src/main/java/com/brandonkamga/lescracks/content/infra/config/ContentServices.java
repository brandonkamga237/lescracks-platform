package com.brandonkamga.lescracks.content.infra.config;

import com.brandonkamga.lescracks.content.application.ArticleAdminService;
import com.brandonkamga.lescracks.content.application.ArticleAdminServiceImpl;
import com.brandonkamga.lescracks.content.application.ArticleCatalog;
import com.brandonkamga.lescracks.content.application.ArticleCatalogImpl;
import com.brandonkamga.lescracks.content.application.ArticleSchedule;
import com.brandonkamga.lescracks.content.application.ArticleViews;
import com.brandonkamga.lescracks.content.application.TalkService;
import com.brandonkamga.lescracks.content.application.TalkServiceImpl;
import com.brandonkamga.lescracks.content.domain.model.ArticleBody;
import com.brandonkamga.lescracks.content.domain.port.ArticleStore;
import com.brandonkamga.lescracks.content.domain.port.TalkStore;
import com.brandonkamga.lescracks.engagement.application.EngagementCounts;
import com.brandonkamga.lescracks.newsletter.application.Announcements;
import com.brandonkamga.lescracks.shared.config.TransactionalServices;
import com.brandonkamga.lescracks.shared.scheduling.ScheduledPublishing;
import com.brandonkamga.lescracks.storage.domain.StorageService;
import com.brandonkamga.lescracks.taxonomy.application.TaxonomyService;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/** Builds content's use cases from their ports and adapters, each inside its transaction. */
@Configuration
public class ContentServices {

    private final TransactionalServices transactional;

    public ContentServices(TransactionalServices transactional) {
        this.transactional = transactional;
    }

    @Bean
    ArticleBody articleBody(ObjectMapper json) {
        return new ArticleBody(json);
    }

    @Bean
    ArticleViews articleViews(TaxonomyService taxonomy, EngagementCounts engagement) {
        return new ArticleViews(taxonomy, engagement);
    }

    @Bean
    ArticleCatalog articleCatalog(ArticleStore articles, ArticleViews views, TaxonomyService taxonomy) {
        return transactional.wrap(ArticleCatalog.class, new ArticleCatalogImpl(articles, views, taxonomy));
    }

    @Bean
    ArticleAdminService articleAdminService(ArticleStore articles, ArticleViews views, TaxonomyService taxonomy, StorageService storage,
                                            Announcements announcements, EngagementCounts engagement, ArticleBody body, ObjectMapper json) {
        return transactional.wrap(ArticleAdminService.class,
                new ArticleAdminServiceImpl(articles, views, taxonomy, storage, announcements, engagement, body, json));
    }

    @Bean
    ScheduledPublishing articleSchedule(ArticleStore articles, Announcements announcements) {
        return transactional.wrap(ScheduledPublishing.class, new ArticleSchedule(articles, announcements));
    }

    @Bean
    TalkService talkService(TalkStore talks, EngagementCounts engagement) {
        return transactional.wrap(TalkService.class, new TalkServiceImpl(talks, engagement));
    }
}
