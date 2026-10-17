package com.brandonkamga.lescracks.shared.bootstrap;

import com.brandonkamga.lescracks.event.domain.Event;
import com.brandonkamga.lescracks.event.domain.EventFormat;
import com.brandonkamga.lescracks.event.domain.EventStatus;
import com.brandonkamga.lescracks.event.domain.EventType;
import com.brandonkamga.lescracks.event.infra.EventRepository;
import com.brandonkamga.lescracks.resource.domain.Article;
import com.brandonkamga.lescracks.resource.domain.Resource;
import com.brandonkamga.lescracks.resource.domain.ResourceStatus;
import com.brandonkamga.lescracks.resource.infra.ArticleRepository;
import com.brandonkamga.lescracks.resource.infra.ResourceRepository;
import com.brandonkamga.lescracks.shared.util.Slugs;
import com.brandonkamga.lescracks.taxonomy.domain.Category;
import com.brandonkamga.lescracks.taxonomy.domain.Tag;
import com.brandonkamga.lescracks.taxonomy.infra.CategoryRepository;
import com.brandonkamga.lescracks.taxonomy.infra.TagRepository;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;

@Component
@Profile({"dev", "demo"})
public class DemoDataSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DemoDataSeeder.class);

    private static final String COVER_IMAGE = "https://placehold.co/1200x630/111111/d4af37?text=LesCracks";

    private final CategoryRepository categories;
    private final TagRepository tags;
    private final ResourceRepository resources;
    private final ArticleRepository articles;
    private final EventRepository events;
    private final ObjectMapper mapper;

    public DemoDataSeeder(CategoryRepository categories, TagRepository tags, ResourceRepository resources,
                          ArticleRepository articles, EventRepository events,
                          ObjectMapper mapper) {
        this.categories = categories;
        this.tags = tags;
        this.resources = resources;
        this.articles = articles;
        this.events = events;
        this.mapper = mapper;
    }

    @Override
    @Transactional
    public void run(String... args) {
        seedTaxonomy();
        seedSampleResources();
        seedSampleEvent();
    }

    private void seedTaxonomy() {
        Taxonomy.ensureThemes(categories);
        if (!tags.existsByNameIgnoreCase("React")) tags.save(Tag.builder().name("React").build());
    }

    private void seedSampleResources() {
        if (resources.count() > 0) {
            return;
        }

        Category frontend = findCategory("Développement web");
        if (frontend == null) {
            return;
        }

        Tag react = tags.findByNameIgnoreCase("React").orElse(null);

        seedArticle(frontend, react);
    }

    private void seedArticle(Category category, Tag tag) {
        String title = "Bienvenue sur LesCracks";
        String html = "<p>LesCracks est une école en ligne pensée pour celles et ceux qui apprennent mieux en construisant.</p>"
                + "<p>Dans cet article de démonstration, tu peux explorer un contenu formaté :</p>"
                + "<ul><li>Des ressources tech choisies</li><li>Des événements et ateliers</li><li>Une communauté qui apprend en faisant</li></ul>"
                + "<p>Bonne découverte !</p>";

        Resource resource = Resource.builder()
                .title(title)
                .description("Un article de démonstration pour découvrir LesCracks et son éditeur de contenu.")
                .coverImage(COVER_IMAGE)
                .category(category)
                .status(ResourceStatus.PUBLISHED)
                .build();
        if (tag != null) {
            resource.getTags().add(tag);
        }
        resource = resources.save(resource);

        var body = mapper.createObjectNode().put("html", html);
        Article article = Article.builder()
                .resourceId(resource.getId())
                .resource(resource)
                .body(body)
                .plainText("LesCracks est une école en ligne. Tu peux explorer des ressources tech choisies.")
                .readingMinutes(1)
                .build();
        articles.save(article);
        log.info("Seeded demo article '{}'", title);
    }

    private void seedSampleEvent() {
        if (events.count() > 0) {
            return;
        }

        Instant start = Instant.now().plus(7, ChronoUnit.DAYS);
        Event event = Event.builder()
                .title("Atelier React en ligne")
                .description("Un atelier de démonstration pour découvrir la plateforme LesCracks et poser tes questions sur React.")
                .type(EventType.WORKSHOP)
                .format(EventFormat.ONLINE)
                .startDate(start)
                .endDate(start.plus(2, ChronoUnit.HOURS))
                .location("En ligne")
                .coverImage(COVER_IMAGE)
                .status(EventStatus.PUBLISHED)
                .build();
        events.save(event);
        log.info("Seeded demo event '{}'", event.getTitle());
    }

    private Category findCategory(String name) {
        return categories.findByNameIgnoreCase(name).orElse(null);
    }
}
