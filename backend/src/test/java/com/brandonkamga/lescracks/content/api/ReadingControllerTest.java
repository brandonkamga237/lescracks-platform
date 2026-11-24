package com.brandonkamga.lescracks.content.api;

import com.brandonkamga.lescracks.content.application.ArticleCatalog;
import com.brandonkamga.lescracks.content.application.ArticleView;
import com.brandonkamga.lescracks.content.domain.model.Article;
import com.brandonkamga.lescracks.content.domain.model.ArticleStatus;
import com.brandonkamga.lescracks.engagement.domain.model.Counts;
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

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** The member's recent reading: their own, as article cards, with a bounded count. */
@WebMvcTest(ReadingController.class)
@AutoConfigureMockMvc(addFilters = false)
class ReadingControllerTest {

    @Autowired private MockMvc mockMvc;

    @MockitoBean private ArticleCatalog catalog;

    private static ArticleView view() {
        Article article = Article.builder().id(1L).slug("spring-boot").title("Spring Boot").description("Description")
                .status(ArticleStatus.PUBLISHED).categoryId(2L)
                .createdAt(Instant.parse("2026-01-01T00:00:00Z")).updatedAt(Instant.parse("2026-01-01T00:00:00Z")).build();
        return new ArticleView(article, Category.builder().id(2L).name("Backend").slug("backend").build(), List.of(), Counts.NONE);
    }

    @Test
    @DisplayName("reads the signed-in member's articles as cards, six unless asked otherwise")
    void listsTheMembersReading() throws Exception {
        when(catalog.listReadBy("awa@example.com", 6)).thenReturn(List.of(view()));

        mockMvc.perform(get("/api/me/reading").principal(() -> "awa@example.com"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].slug").value("spring-boot"))
                .andExpect(jsonPath("$[0].categoryName").value("Backend"));
    }

    @Test
    @DisplayName("an asked count is kept between one and twelve")
    void boundsTheCount() throws Exception {
        mockMvc.perform(get("/api/me/reading").param("limit", "500").principal(() -> "awa@example.com")).andExpect(status().isOk());
        mockMvc.perform(get("/api/me/reading").param("limit", "0").principal(() -> "awa@example.com")).andExpect(status().isOk());

        verify(catalog).listReadBy("awa@example.com", 12);
        verify(catalog).listReadBy("awa@example.com", 1);
    }
}
