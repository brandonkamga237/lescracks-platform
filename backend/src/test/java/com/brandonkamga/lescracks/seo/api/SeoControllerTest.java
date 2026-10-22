package com.brandonkamga.lescracks.seo.api;

import com.brandonkamga.lescracks.content.application.ArticleCatalog;
import com.brandonkamga.lescracks.content.application.ArticleView;
import com.brandonkamga.lescracks.content.application.TalkService;
import com.brandonkamga.lescracks.content.domain.model.Article;
import com.brandonkamga.lescracks.content.domain.model.ArticleStatus;
import com.brandonkamga.lescracks.engagement.domain.model.Counts;
import com.brandonkamga.lescracks.event.application.EventCatalog;
import com.brandonkamga.lescracks.event.application.EventView;
import com.brandonkamga.lescracks.event.domain.model.Event;
import com.brandonkamga.lescracks.event.domain.model.EventFormat;
import com.brandonkamga.lescracks.event.domain.model.EventStatus;
import com.brandonkamga.lescracks.event.domain.model.EventType;
import com.brandonkamga.lescracks.shared.paging.Paged;
import com.brandonkamga.lescracks.taxonomy.domain.model.Category;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.List;

import static org.hamcrest.Matchers.allOf;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.not;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(SeoController.class)
@AutoConfigureMockMvc(addFilters = false)
class SeoControllerTest {

    @Autowired private MockMvc mockMvc;

    @MockitoBean private ArticleCatalog articles;
    @MockitoBean private EventCatalog events;
    @MockitoBean private TalkService talks;

    @Test
    @DisplayName("the home page a crawler gets carries the brand, the favicon, the main sections and the site's identity")
    void homeSnapshotIsComplete() throws Exception {
        when(articles.search(any(), any(), any(), any())).thenReturn(new Paged<>(List.of(), 0, 50, 0));
        when(talks.listPublished(any())).thenReturn(new Paged<>(List.of(), 0, 50, 0));
        when(events.search(any(), any(), any())).thenReturn(new Paged<>(List.of(), 0, 50, 0));

        mockMvc.perform(get("/seo/pages/home"))
                .andExpect(status().isOk())
                .andExpect(content().string(allOf(
                        containsString("<title>LesCracks · Apprendre la tech et passer à la pratique</title>"),
                        containsString("href=\"/favicon-96x96.png\""),
                        containsString(">LesCracks Talk</a></h2>"),
                        not(containsString("CrackLab")),
                        containsString(">Blog</a></h2>"),
                        containsString(">Formations</a></h2>"),
                        containsString("\"@type\":\"WebSite\""),
                        containsString("\"alternateName\":[\"Les Cracks\",\"lescracks\"]"),
                        containsString("/icon-512.png"))));
    }

    @Test
    @DisplayName("an article snapshot lives under /blog, with the blog in its breadcrumb")
    void articleSnapshotUnderBlog() throws Exception {
        Article article = Article.builder().id(4L).slug("singleton-java").title("Le Singleton").description("Un pattern")
                .coverImage("/api/files/c.png").status(ArticleStatus.PUBLISHED).categoryId(2L).readingMinutes(4)
                .plainText("Une seule instance.\n\nPartagée par tous.")
                .createdAt(Instant.parse("2026-10-01T00:00:00Z")).updatedAt(Instant.parse("2026-10-01T00:00:00Z")).build();
        when(articles.requirePublished("singleton-java")).thenReturn(new ArticleView(article,
                Category.builder().id(2L).name("Backend").build(), List.of("Java"), Counts.NONE));

        mockMvc.perform(get("/seo/blog/singleton-java"))
                .andExpect(status().isOk())
                .andExpect(content().string(allOf(
                        containsString("/blog/singleton-java\""),
                        containsString(">Blog</a>"),
                        containsString("Backend"),
                        containsString("Partagée par tous."),
                        containsString("\"@type\":\"Article\""))));
    }

    @Test
    @DisplayName("an event snapshot carries its canonical page, its facts and an Event in JSON-LD")
    void eventSnapshot() throws Exception {
        Event event = Event.builder().id(7L).slug("hackathon-001").title("Hackathon 001").description("Trois semaines pour construire.")
                .type(EventType.HACKATHON).format(EventFormat.ONLINE).status(EventStatus.PUBLISHED)
                .startDate(Instant.parse("2026-11-01T09:00:00Z")).build();
        when(events.requirePublished("7")).thenReturn(new EventView(event, Counts.NONE));

        mockMvc.perform(get("/seo/evenements/7"))
                .andExpect(status().isOk())
                .andExpect(content().string(allOf(
                        containsString("/evenements/hackathon-001\""),
                        containsString("Trois semaines pour construire."),
                        containsString("\"@type\":\"Event\""))));
    }
}
