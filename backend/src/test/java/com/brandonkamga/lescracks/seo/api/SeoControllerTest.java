package com.brandonkamga.lescracks.seo.api;

import com.brandonkamga.lescracks.event.domain.EventService;
import com.brandonkamga.lescracks.resource.api.ResourceMapper;
import com.brandonkamga.lescracks.resource.domain.ResourceService;
import com.brandonkamga.lescracks.resource.domain.ResourceStatus;
import com.brandonkamga.lescracks.resource.domain.Resource;
import com.brandonkamga.lescracks.resource.api.dto.ResourceResponse;
import com.brandonkamga.lescracks.talk.domain.TalkService;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.data.domain.Page;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;

import java.util.Set;

import static org.hamcrest.Matchers.allOf;
import static org.hamcrest.Matchers.containsString;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(SeoController.class)
@AutoConfigureMockMvc(addFilters = false)
class SeoControllerTest {

    @Autowired private MockMvc mockMvc;

    @MockitoBean private ResourceService resources;
    @MockitoBean private EventService events;
    @MockitoBean private TalkService talks;
    @MockitoBean private ResourceMapper mapper;

    @Test
    @DisplayName("the home page a crawler gets carries the brand, the favicon, the main sections and the site's identity")
    void homeSnapshotIsComplete() throws Exception {
        when(resources.search(any(), any(), any(), any(), any())).thenReturn(Page.empty());
        when(events.published(any(), any(), any())).thenReturn(Page.empty());

        mockMvc.perform(get("/seo/pages/home"))
                .andExpect(status().isOk())
                .andExpect(content().string(allOf(
                        containsString("<title>LesCracks · Apprendre la tech et passer à la pratique</title>"),
                        containsString("href=\"/favicon-96x96.png\""),
                        containsString(">CrackLab</a></h2>"),
                        containsString(">Blog</a></h2>"),
                        containsString(">Formations</a></h2>"),
                        containsString("\"@type\":\"WebSite\""),
                        containsString("\"alternateName\":[\"Les Cracks\",\"lescracks\"]"),
                        containsString("/icon-512.png"))));
    }

    @Test
    @DisplayName("an article snapshot lives under /blog, with the blog in its breadcrumb")
    void articleSnapshotUnderBlog() throws Exception {
        Resource article = Resource.builder().id(4L).slug("singleton-java").title("Le Singleton").description("Un pattern")
                .coverImage("/api/files/c.png").status(ResourceStatus.PUBLISHED).build();
        when(resources.requirePublishedBySlugOrId("singleton-java")).thenReturn(article);
        when(mapper.toResponse(article)).thenReturn(new ResourceResponse(4L, "singleton-java", "Le Singleton", "Un pattern",
                "/api/files/c.png", ResourceStatus.PUBLISHED, 2L, "Backend", Set.of("Java"), 0L, 0,
                Instant.parse("2026-10-01T00:00:00Z"), Instant.parse("2026-10-01T00:00:00Z"), null, 4, null, null));

        mockMvc.perform(get("/seo/blog/singleton-java"))
                .andExpect(status().isOk())
                .andExpect(content().string(allOf(
                        containsString("/blog/singleton-java\""),
                        containsString(">Blog</a>"),
                        containsString("\"@type\":\"Article\""))));
    }
}
