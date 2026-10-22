package com.brandonkamga.lescracks.content.api;

import com.brandonkamga.lescracks.content.application.ArticleAdminService;
import com.brandonkamga.lescracks.content.application.ArticleCatalog;
import com.brandonkamga.lescracks.content.application.ArticleDraft;
import com.brandonkamga.lescracks.content.application.ArticleView;
import com.brandonkamga.lescracks.content.application.ThemeCount;
import com.brandonkamga.lescracks.content.domain.model.Article;
import com.brandonkamga.lescracks.content.domain.model.ArticleStatus;
import com.brandonkamga.lescracks.engagement.domain.model.Counts;
import com.brandonkamga.lescracks.shared.exception.NotFoundException;
import com.brandonkamga.lescracks.shared.paging.PageQuery;
import com.brandonkamga.lescracks.shared.paging.Paged;
import com.brandonkamga.lescracks.storage.domain.Upload;
import com.brandonkamga.lescracks.taxonomy.domain.model.Category;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * The HTTP edge of the blog: status codes, payload shape, parameter binding and the translation
 * of a business exception into an {@code ApiError}. Filters are off: who may call which route is
 * asserted once, in shared/security.
 */
@WebMvcTest(ArticleController.class)
@AutoConfigureMockMvc(addFilters = false)
class ArticleControllerTest {

    @Autowired private MockMvc mockMvc;

    @MockitoBean private ArticleCatalog catalog;
    @MockitoBean private ArticleAdminService admin;

    private static final Category BACKEND = Category.builder().id(2L).name("Backend").slug("backend").build();

    private static ArticleView view() {
        Article article = Article.builder().id(1L).slug("spring-boot").title("Spring Boot").description("Description")
                .coverImage("https://cdn.example/cover.png").status(ArticleStatus.PUBLISHED).categoryId(2L)
                .createdAt(Instant.parse("2026-01-01T00:00:00Z")).updatedAt(Instant.parse("2026-01-01T00:00:00Z")).build();
        return new ArticleView(article, BACKEND, List.of("Java"), new Counts(12, 3));
    }

    @Test
    @DisplayName("the listing keeps the JSON the blog reads: a pager, card fields and audience figures")
    void listsPublishedArticles() throws Exception {
        when(catalog.search(any(), any(), any(), eq(new PageQuery(1, 6)))).thenReturn(new Paged<>(List.of(view()), 1, 6, 7));

        mockMvc.perform(get("/api/resources").param("page", "1").param("size", "6"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].slug").value("spring-boot"))
                .andExpect(jsonPath("$.content[0].categoryName").value("Backend"))
                .andExpect(jsonPath("$.content[0].tags[0]").value("Java"))
                .andExpect(jsonPath("$.content[0].likeCount").value(3))
                .andExpect(jsonPath("$.content[0].viewCount").value(12))
                .andExpect(jsonPath("$.totalElements").value(7))
                .andExpect(jsonPath("$.page").value(1));
    }

    @Test
    @DisplayName("an unknown slug answers 404 with the NOT_FOUND code, not a 500")
    void translatesNotFound() throws Exception {
        when(catalog.requirePublished("absent")).thenThrow(new NotFoundException("Resource", "slug", "absent"));

        mockMvc.perform(get("/api/resources/absent"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("NOT_FOUND"))
                .andExpect(jsonPath("$.path").value("/api/resources/absent"));
    }

    @Test
    @DisplayName("a query parameter that cannot convert is the caller's mistake: 400, no stack trace")
    void rejectsAnUnconvertibleParameter() throws Exception {
        mockMvc.perform(get("/api/resources").param("categoryId", "abc"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("BAD_REQUEST"))
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("categoryId")));
    }

    @Test
    @DisplayName("validation refuses an empty title before the use case is ever called")
    void validatesTheArticlePayload() throws Exception {
        var data = new MockMultipartFile("data", "data.json", MediaType.APPLICATION_JSON_VALUE, """
                {"title": "  ", "description": "Une description", "categoryId": 1, "body": []}
                """.getBytes());

        mockMvc.perform(multipart("/api/resources/admin/articles").file(data))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
                .andExpect(jsonPath("$.fields.title").exists());
    }

    @Test
    @DisplayName("the multipart form becomes a draft and an upload: no servlet type reaches the use case")
    void createsFromTheMultipartForm() throws Exception {
        var data = new MockMultipartFile("data", "data.json", MediaType.APPLICATION_JSON_VALUE, """
                {"title": "Spring Boot", "description": "Description", "categoryId": 2, "tagIds": [5],
                 "status": "PUBLISHED", "body": {"blocks": []}}
                """.getBytes());
        var cover = new MockMultipartFile("coverImageFile", "cover.png", "image/png", new byte[] {1, 2, 3});
        when(admin.create(any(), any())).thenReturn(view());

        mockMvc.perform(multipart("/api/resources/admin/articles").file(data).file(cover))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1));

        ArgumentCaptor<ArticleDraft> draft = ArgumentCaptor.forClass(ArticleDraft.class);
        ArgumentCaptor<Upload> upload = ArgumentCaptor.forClass(Upload.class);
        verify(admin).create(draft.capture(), upload.capture());
        assertThat(draft.getValue().tagIds()).isEqualTo(Set.of(5L));
        assertThat(draft.getValue().status()).isEqualTo(ArticleStatus.PUBLISHED);
        assertThat(upload.getValue().originalName()).isEqualTo("cover.png");
        assertThat(upload.getValue().content()).containsExactly(1, 2, 3);
    }

    @Test
    @DisplayName("themes carry their article count, and the literal path is not read as an article slug")
    void listsThemesWithTheirArticleCount() throws Exception {
        when(catalog.listThemes()).thenReturn(List.of(new ThemeCount(BACKEND, 7)));

        mockMvc.perform(get("/api/resources/themes"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].slug").value("backend"))
                .andExpect(jsonPath("$[0].articleCount").value(7));
    }
}
