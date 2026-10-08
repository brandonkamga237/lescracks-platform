package com.brandonkamga.lescracks.seo.api;

import com.brandonkamga.lescracks.event.domain.EventService;
import com.brandonkamga.lescracks.resource.domain.ResourceMapper;
import com.brandonkamga.lescracks.resource.domain.ResourceService;
import com.brandonkamga.lescracks.resource.infra.ArticleRepository;
import com.brandonkamga.lescracks.talk.domain.TalkService;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.data.domain.Page;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

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
    @MockitoBean private ArticleRepository articles;

    @Test
    @DisplayName("the home page a crawler gets carries the brand, the favicon, the main sections and the site's identity")
    void homeSnapshotIsComplete() throws Exception {
        when(resources.search(any(), any(), any(), any(), any(), any())).thenReturn(Page.empty());
        when(events.published(any(), any(), any())).thenReturn(Page.empty());

        mockMvc.perform(get("/seo/pages/home"))
                .andExpect(status().isOk())
                .andExpect(content().string(allOf(
                        containsString("<title>LesCracks · Apprendre la tech et passer à la pratique</title>"),
                        containsString("href=\"/favicon-96x96.png\""),
                        containsString(">CrackLab</a></h2>"),
                        containsString(">Bibliothèque</a></h2>"),
                        containsString("\"@type\":\"WebSite\""),
                        containsString("\"alternateName\":[\"Les Cracks\",\"lescracks\"]"),
                        containsString("/icon-512.png"))));
    }
}
