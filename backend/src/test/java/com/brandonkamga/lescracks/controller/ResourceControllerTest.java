package com.brandonkamga.lescracks.controller;

import com.brandonkamga.lescracks.domain.Category;
import com.brandonkamga.lescracks.domain.Resource;
import com.brandonkamga.lescracks.domain.ResourceArticle;
import com.brandonkamga.lescracks.domain.ResourceEbook;
import com.brandonkamga.lescracks.domain.ResourceKind;
import com.brandonkamga.lescracks.domain.ResourceVideo;
import com.brandonkamga.lescracks.exception.GlobalExceptionHandler;
import com.brandonkamga.lescracks.mapper.MediaMapper;
import com.brandonkamga.lescracks.mapper.ResourceMapper;
import com.brandonkamga.lescracks.mapper.TaxonomyMapper;
import com.brandonkamga.lescracks.service.interfaces.MediaService;
import com.brandonkamga.lescracks.service.interfaces.ResourceService;
import com.brandonkamga.lescracks.service.interfaces.StorageService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.web.PageableHandlerMethodArgumentResolver;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.io.ByteArrayInputStream;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * The catalogue over HTTP, standalone: no Spring context, no database, no Docker.
 *
 * What this layer owns is narrow but easy to get wrong — which status a write answers with,
 * whether a rejected body is caught before the service is called, and whether query
 * parameters arrive as the service expects them. Access rules are not tested here; they live
 * in the filter chain and are covered by SecurityRulesIT.
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class ResourceControllerTest {

    @Mock
    ResourceService resources;

    @Mock
    StorageService storage;

    @Mock
    MediaService media;

    MockMvc mvc;
    ObjectMapper json = new ObjectMapper();

    @BeforeEach
    void setUp() {
        ResourceMapper mapper = new ResourceMapper(
                new MediaMapper(media), new TaxonomyMapper(), json, "/api/resources/download");

        mvc = MockMvcBuilders
                .standaloneSetup(new ResourceController(resources, storage, mapper))
                .setControllerAdvice(new GlobalExceptionHandler())
                .setCustomArgumentResolvers(new PageableHandlerMethodArgumentResolver())
                .build();
    }

    private static ResourceVideo video() {
        ResourceVideo video = new ResourceVideo();
        video.setId(1L);
        video.setSlug("intro-spring");
        video.setTitle("Introduction à Spring");
        video.setCategory(Category.builder().id(1L).name("Backend").build());
        video.setCreatedAt(Instant.now());
        video.setExternalUrl("https://youtube.com/watch?v=1");
        return video;
    }

    private static String videoRequest() {
        return """
                {"common":{"title":"Introduction à Spring","categoryId":1,"tagIds":[]},
                 "externalUrl":"https://youtube.com/watch?v=1"}
                """;
    }

    @Test
    @DisplayName("the catalogue answers a page shaped for a client")
    void searchReturnsAPage() throws Exception {
        when(resources.search(any(), any(), any(), any(), any()))
                .thenReturn(new PageImpl<>(List.of(video())));

        mvc.perform(get("/api/resources"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].slug").value("intro-spring"))
                .andExpect(jsonPath("$.totalElements").value(1));
    }

    @Test
    @DisplayName("every filter reaches the service in the type it declared")
    void passesEveryFilterThrough() throws Exception {
        when(resources.search(any(), any(), any(), any(), any())).thenReturn(new PageImpl<>(List.of()));

        mvc.perform(get("/api/resources")
                        .param("kind", "VIDEO")
                        .param("categoryId", "3")
                        .param("tagIds", "1", "2")
                        .param("search", "spring"))
                .andExpect(status().isOk());

        // A String where an enum belongs is what made the old type filter answer 500.
        verify(resources).search(
                org.mockito.ArgumentMatchers.eq(ResourceKind.VIDEO),
                org.mockito.ArgumentMatchers.eq(3L),
                org.mockito.ArgumentMatchers.eq(Set.of(1L, 2L)),
                org.mockito.ArgumentMatchers.eq("spring"),
                any());
    }

    @Test
    @DisplayName("an unknown kind is a bad request, not a fault")
    void refusesAnUnknownKind() throws Exception {
        mvc.perform(get("/api/resources").param("kind", "PODCAST"))
                .andExpect(status().is4xxClientError());

        verify(resources, never()).search(any(), any(), any(), any(), any());
    }

    @Test
    @DisplayName("a resource is fetched by slug, because that is what is in a shared link")
    void fetchesBySlug() throws Exception {
        when(resources.requireBySlug("intro-spring")).thenReturn(video());

        mvc.perform(get("/api/resources/intro-spring"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.video.externalUrl").value("https://youtube.com/watch?v=1"))
                .andExpect(jsonPath("$.ebook").doesNotExist())
                .andExpect(jsonPath("$.article").doesNotExist());
    }

    @Test
    @DisplayName("counting a view answers nothing, so a reader's page never waits on it")
    void recordViewAnswersNoContent() throws Exception {
        mvc.perform(post("/api/resources/1/view"))
                .andExpect(status().isNoContent())
                .andExpect(content().string(""));

        verify(resources).recordView(1L);
    }

    @Test
    @DisplayName("creating a video answers 201 and the resource that was made")
    void createVideoAnswersCreated() throws Exception {
        when(resources.createVideo(any())).thenReturn(video());

        mvc.perform(post("/api/resources/admin/videos")
                        .contentType(MediaType.APPLICATION_JSON).content(videoRequest()))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.kind").value("VIDEO"));
    }

    @Test
    @DisplayName("the request is turned into the draft the service expects")
    void mapsTheRequestToADraft() throws Exception {
        when(resources.createVideo(any())).thenReturn(video());

        mvc.perform(post("/api/resources/admin/videos")
                .contentType(MediaType.APPLICATION_JSON).content(videoRequest()));

        ArgumentCaptor<ResourceService.VideoDraft> draft =
                ArgumentCaptor.forClass(ResourceService.VideoDraft.class);
        verify(resources).createVideo(draft.capture());
        assertThat(draft.getValue().common().title()).isEqualTo("Introduction à Spring");
        assertThat(draft.getValue().common().categoryId()).isEqualTo(1L);
        assertThat(draft.getValue().externalUrl()).isEqualTo("https://youtube.com/watch?v=1");
    }

    @Test
    @DisplayName("a video with no link never reaches the service")
    void refusesAVideoWithoutALink() throws Exception {
        String noLink = "{\"common\":{\"title\":\"T\",\"categoryId\":1},\"externalUrl\":\"\"}";

        mvc.perform(post("/api/resources/admin/videos")
                        .contentType(MediaType.APPLICATION_JSON).content(noLink))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
                .andExpect(jsonPath("$.fields.externalUrl").exists());

        verify(resources, never()).createVideo(any());
    }

    @Test
    @DisplayName("a resource with no category never reaches the service either")
    void refusesAResourceWithoutACategory() throws Exception {
        String noCategory = "{\"common\":{\"title\":\"T\"},\"externalUrl\":\"https://y/1\"}";

        mvc.perform(post("/api/resources/admin/videos")
                        .contentType(MediaType.APPLICATION_JSON).content(noCategory))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fields['common.categoryId']").exists());
    }

    @Test
    @DisplayName("an article body travels as json and is stored as text")
    void articleBodyIsSerialisedForTheService() throws Exception {
        ResourceArticle article = new ResourceArticle();
        article.setId(2L);
        article.setSlug("a");
        article.setTitle("Un article");
        article.setCategory(Category.builder().id(1L).name("Backend").build());
        article.setCreatedAt(Instant.now());
        article.setBody("{\"type\":\"doc\"}");
        when(resources.createArticle(any())).thenReturn(article);

        mvc.perform(post("/api/resources/admin/articles")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"common":{"title":"Un article","categoryId":1},
                                 "body":{"type":"doc","content":[]},"authorName":"Ada"}
                                """))
                .andExpect(status().isCreated());

        ArgumentCaptor<ResourceService.ArticleDraft> draft =
                ArgumentCaptor.forClass(ResourceService.ArticleDraft.class);
        verify(resources).createArticle(draft.capture());
        assertThat(draft.getValue().body()).contains("\"type\":\"doc\"");
    }

    @Test
    @DisplayName("updating answers 200, not 201: nothing was created")
    void updateAnswersOk() throws Exception {
        when(resources.updateVideo(anyLong(), any())).thenReturn(video());

        mvc.perform(put("/api/resources/admin/videos/1")
                        .contentType(MediaType.APPLICATION_JSON).content(videoRequest()))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("publishing is a separate call from editing")
    void publishingIsItsOwnCall() throws Exception {
        when(resources.setPublished(1L, true)).thenReturn(video());

        mvc.perform(put("/api/resources/admin/1/published").param("published", "true"))
                .andExpect(status().isOk());

        verify(resources).setPublished(1L, true);
    }

    @Test
    @DisplayName("deleting answers no content")
    void deleteAnswersNoContent() throws Exception {
        mvc.perform(delete("/api/resources/admin/1"))
                .andExpect(status().isNoContent());

        verify(resources).delete(1L);
    }

    @Test
    @DisplayName("an ebook download keeps its original filename on the way out")
    void downloadKeepsTheOriginalName() throws Exception {
        ResourceEbook ebook = new ResourceEbook();
        ebook.setId(4L);
        ebook.setFileKey("ebooks/abc.pdf");
        ebook.setOriginalName("guide spring.pdf");
        ebook.setContentType("application/pdf");
        when(resources.require(4L)).thenReturn(ebook);
        when(storage.read("ebooks/abc.pdf")).thenReturn(Optional.of(new StorageService.StoredObject(
                new ByteArrayInputStream("contenu".getBytes()), "application/pdf", 7)));

        mvc.perform(get("/api/resources/download/4"))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Disposition", "attachment; filename=\"guide spring.pdf\""))
                .andExpect(header().string("Content-Type", "application/pdf"));
    }

    @Test
    @DisplayName("downloading something that is not an ebook is a 404, not a cast failure")
    void downloadingANonEbookIsNotFound() throws Exception {
        when(resources.require(1L)).thenReturn(video());

        mvc.perform(get("/api/resources/download/1"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("NOT_FOUND"));

        verify(storage, never()).read(any());
    }

    @Test
    @DisplayName("a row whose file has vanished from storage is a 404, not a stream of nothing")
    void downloadingAMissingFileIsNotFound() throws Exception {
        ResourceEbook ebook = new ResourceEbook();
        ebook.setId(4L);
        ebook.setFileKey("ebooks/disparu.pdf");
        Resource asResource = ebook;
        when(resources.require(4L)).thenReturn(asResource);
        when(storage.read("ebooks/disparu.pdf")).thenReturn(Optional.empty());

        mvc.perform(get("/api/resources/download/4"))
                .andExpect(status().isNotFound());
    }
}
