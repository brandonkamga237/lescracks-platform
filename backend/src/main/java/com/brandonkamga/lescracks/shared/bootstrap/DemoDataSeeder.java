package com.brandonkamga.lescracks.shared.bootstrap;

import com.brandonkamga.lescracks.event.application.EventAdminService;
import com.brandonkamga.lescracks.event.application.EventDraft;
import com.brandonkamga.lescracks.event.domain.model.EventFormat;
import com.brandonkamga.lescracks.event.domain.model.EventStatus;
import com.brandonkamga.lescracks.event.domain.model.EventType;
import com.brandonkamga.lescracks.content.application.ArticleAdminService;
import com.brandonkamga.lescracks.content.application.ArticleDraft;
import com.brandonkamga.lescracks.content.domain.model.ArticleSearch;
import com.brandonkamga.lescracks.content.domain.model.ArticleStatus;
import com.brandonkamga.lescracks.shared.paging.PageQuery;
import com.brandonkamga.lescracks.taxonomy.application.TaxonomyService;
import com.brandonkamga.lescracks.taxonomy.domain.model.Category;
import com.brandonkamga.lescracks.taxonomy.domain.model.Tag;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Set;

@Component
@Profile({"dev", "demo"})
public class DemoDataSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DemoDataSeeder.class);

    private static final String COVER_IMAGE = "https://placehold.co/1200x630/111111/d4af37?text=LesCracks";

    private final TaxonomyService taxonomy;
    private final ArticleAdminService articles;
    private final EventAdminService events;
    private final ObjectMapper mapper;

    public DemoDataSeeder(TaxonomyService taxonomy, ArticleAdminService articles, EventAdminService events, ObjectMapper mapper) {
        this.taxonomy = taxonomy;
        this.articles = articles;
        this.events = events;
        this.mapper = mapper;
    }

    @Override
    public void run(String... args) {
        taxonomy.ensureCategories(Taxonomy.THEMES);
        seedSampleArticle();
        seedSampleEvent();
    }

    private void seedSampleArticle() {
        if (articles.list(ArticleSearch.backOffice(null, null, null, null), new PageQuery(0, 1)).total() > 0) {
            return;
        }
        Category frontend = taxonomy.listCategories().stream()
                .filter(category -> category.getName().equalsIgnoreCase("Développement web")).findFirst().orElse(null);
        if (frontend == null) {
            return;
        }
        Tag react = taxonomy.listTags().stream().filter(tag -> tag.getName().equalsIgnoreCase("React")).findFirst()
                .orElseGet(() -> taxonomy.createTag("React"));

        String title = "Bienvenue sur LesCracks";
        String html = "<p>LesCracks est une école en ligne pensée pour celles et ceux qui apprennent mieux en construisant.</p>"
                + "<p>Dans cet article de démonstration, tu peux explorer un contenu formaté :</p>"
                + "<ul><li>Des ressources tech choisies</li><li>Des événements et ateliers</li><li>Une communauté qui apprend en faisant</li></ul>"
                + "<p>Bonne découverte !</p>";

        articles.create(new ArticleDraft(title,
                "Un article de démonstration pour découvrir LesCracks et son éditeur de contenu.",
                COVER_IMAGE, frontend.getId(), Set.of(react.getId()), ArticleStatus.PUBLISHED,
                mapper.createObjectNode().put("html", html), null), null);
        log.info("Seeded demo article '{}'", title);
    }

    private void seedSampleEvent() {
        if (events.list(new PageQuery(0, 1)).total() > 0) {
            return;
        }

        Instant start = Instant.now().plus(7, ChronoUnit.DAYS);
        String title = "Atelier React en ligne";
        events.create(new EventDraft(title,
                "Un atelier de démonstration pour découvrir la plateforme LesCracks et poser tes questions sur React.",
                EventType.WORKSHOP, EventFormat.ONLINE, start, start.plus(2, ChronoUnit.HOURS), "En ligne",
                EventStatus.PUBLISHED, null, false, 1, null), null);
        log.info("Seeded demo event '{}'", title);
    }
}
