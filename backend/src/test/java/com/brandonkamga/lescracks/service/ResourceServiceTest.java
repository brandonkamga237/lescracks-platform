package com.brandonkamga.lescracks.service;

import com.brandonkamga.lescracks.domain.Category;
import com.brandonkamga.lescracks.domain.Media;
import com.brandonkamga.lescracks.domain.Resource;
import com.brandonkamga.lescracks.domain.ResourceArticle;
import com.brandonkamga.lescracks.domain.ResourceEbook;
import com.brandonkamga.lescracks.domain.ResourceKind;
import com.brandonkamga.lescracks.domain.ResourceVideo;
import com.brandonkamga.lescracks.exception.BadRequestException;
import com.brandonkamga.lescracks.exception.NotFoundException;
import com.brandonkamga.lescracks.repository.MediaRepository;
import com.brandonkamga.lescracks.repository.ResourceRepository;
import com.brandonkamga.lescracks.service.impl.ResourceServiceImpl;
import com.brandonkamga.lescracks.service.interfaces.MediaService;
import com.brandonkamga.lescracks.service.interfaces.ResourceService.ArticleDraft;
import com.brandonkamga.lescracks.service.interfaces.ResourceService.Common;
import com.brandonkamga.lescracks.service.interfaces.ResourceService.EbookDraft;
import com.brandonkamga.lescracks.service.interfaces.ResourceService.VideoDraft;
import com.brandonkamga.lescracks.service.interfaces.StorageService;
import com.brandonkamga.lescracks.service.interfaces.TaxonomyService;
import com.brandonkamga.lescracks.util.ArticleBody;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.data.domain.PageRequest;
import org.springframework.mock.web.MockMultipartFile;

import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * The catalogue: videos we point at, ebooks we hold, articles we wrote.
 *
 * Three kinds through one service, so the risk is drift — a rule enforced on creating a
 * video and forgotten on creating an article. The tests below deliberately ask the same
 * questions of all three.
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class ResourceServiceTest {

    @Mock
    ResourceRepository resources;

    @Mock
    MediaRepository mediaRepository;

    @Mock
    MediaService media;

    @Mock
    TaxonomyService taxonomy;

    @Mock
    StorageService storage;

    ResourceServiceImpl service;

    private static final Category BACKEND = Category.builder().id(1L).name("Backend").build();
    private static final String BODY = """
            {"type":"doc","content":[
              {"type":"paragraph","text":"Un texte suffisamment long pour compter."},
              {"type":"image","mediaId":12}]}
            """;

    @BeforeEach
    void setUp() {
        service = new ResourceServiceImpl(resources, mediaRepository, media, taxonomy, storage,
                new ArticleBody(new ObjectMapper()));
        when(taxonomy.requireCategory(1L)).thenReturn(BACKEND);
        when(taxonomy.requireAll(any())).thenReturn(Set.of());
        when(resources.existsBySlug(anyString())).thenReturn(false);
        when(resources.save(any())).thenAnswer(call -> call.getArgument(0));
    }

    private static Common common(String title) {
        return new Common(title, "Résumé", 1L, Set.of(), null);
    }

    private static MockMultipartFile pdf() {
        return new MockMultipartFile("file", "guide.pdf", "application/pdf", "contenu".getBytes());
    }

    // ── Slugs, shared by all three kinds ──────────────────────────────────────

    @Test
    @DisplayName("each kind gets a slug derived from its title")
    void everyKindGetsASlug() {
        when(storage.store(any(), any(), any())).thenReturn("ebooks/k");

        assertThat(service.createVideo(new VideoDraft(common("Introduction à Spring"), "https://y/1", null)).getSlug())
                .isEqualTo("introduction-a-spring");
        assertThat(service.createArticle(new ArticleDraft(common("Déployer avec Docker"), BODY, "Ada")).getSlug())
                .isEqualTo("deployer-avec-docker");
        assertThat(service.createEbook(new EbookDraft(common("Guide Spring"), 40), pdf()).getSlug())
                .isEqualTo("guide-spring");
    }

    @Test
    @DisplayName("a taken slug is numbered rather than reused")
    void suffixesATakenSlug() {
        when(resources.existsBySlug("intro")).thenReturn(true);
        when(resources.existsBySlug("intro-2")).thenReturn(false);

        assertThat(service.createVideo(new VideoDraft(common("Intro"), "https://y/1", null)).getSlug())
                .isEqualTo("intro-2");
    }

    @ParameterizedTest
    @ValueSource(strings = {"", "   "})
    @DisplayName("no kind can be created without a title")
    void everyKindNeedsATitle(String blank) {
        assertThatThrownBy(() -> service.createVideo(new VideoDraft(common(blank), "https://y/1", null)))
                .isInstanceOf(BadRequestException.class).hasMessageContaining("titre");
        assertThatThrownBy(() -> service.createArticle(new ArticleDraft(common(blank), BODY, null)))
                .isInstanceOf(BadRequestException.class).hasMessageContaining("titre");
        verify(resources, never()).save(any());
    }

    // ── Video ─────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("a video is a link we point at, and the link is required")
    void videoNeedsItsLink() {
        assertThatThrownBy(() -> service.createVideo(new VideoDraft(common("Une vidéo"), "  ", null)))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("lien de la vidéo");
    }

    @Test
    @DisplayName("a video link is trimmed")
    void trimsTheVideoLink() {
        ResourceVideo video = (ResourceVideo) service.createVideo(
                new VideoDraft(common("Une vidéo"), "  https://youtube.com/watch?v=1  ", 600));

        assertThat(video.getExternalUrl()).isEqualTo("https://youtube.com/watch?v=1");
        assertThat(video.getDurationSeconds()).isEqualTo(600);
        assertThat(video.getKind()).isEqualTo(ResourceKind.VIDEO);
    }

    // ── Article ───────────────────────────────────────────────────────────────

    @Test
    @DisplayName("an article derives its text, its reading time and its images")
    void articleDerivesWhatItCan() {
        when(mediaRepository.findAllById(any())).thenReturn(List.of(Media.builder().id(12L).build()));

        ResourceArticle article = (ResourceArticle) service.createArticle(
                new ArticleDraft(common("Un article"), BODY, "Ada"));

        // None of the three is asked of the caller, so none can be supplied wrongly.
        assertThat(article.getBodyText()).contains("Un texte suffisamment long");
        assertThat(article.getReadingMinutes()).isEqualTo(1);
        assertThat(article.getMedia()).hasSize(1);
        assertThat(article.getAuthorName()).isEqualTo("Ada");
    }

    @Test
    @DisplayName("an article with no body is refused")
    void articleNeedsABody() {
        assertThatThrownBy(() -> service.createArticle(new ArticleDraft(common("Un article"), "  ", null)))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("contenu de l'article");
    }

    @Test
    @DisplayName("an article whose blocks hold no text is refused, not saved empty")
    void articleNeedsActualText() {
        String empty = "{\"type\":\"doc\",\"content\":[{\"type\":\"divider\"}]}";

        assertThatThrownBy(() -> service.createArticle(new ArticleDraft(common("Vide"), empty, null)))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("aucun texte");
    }

    @Test
    @DisplayName("an article body that will not parse is refused at the door")
    void articleBodyMustBeJson() {
        assertThatThrownBy(() -> service.createArticle(new ArticleDraft(common("Cassé"), "{ pas du json", null)))
                .isInstanceOf(IllegalArgumentException.class);
    }

    // ── Ebook ─────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("an ebook is stored and remembers where, how big and under what name")
    void ebookIsStored() {
        when(storage.store(eq("guide.pdf"), any(), eq("application/pdf"))).thenReturn("ebooks/abc.pdf");

        ResourceEbook ebook = (ResourceEbook) service.createEbook(
                new EbookDraft(common("Guide"), 40), pdf());

        assertThat(ebook.getFileKey()).isEqualTo("ebooks/abc.pdf");
        assertThat(ebook.getOriginalName()).isEqualTo("guide.pdf");
        assertThat(ebook.getSizeBytes()).isEqualTo("contenu".getBytes().length);
        assertThat(ebook.getPageCount()).isEqualTo(40);
    }

    @Test
    @DisplayName("an ebook without a file is refused")
    void ebookNeedsAFile() {
        assertThatThrownBy(() -> service.createEbook(new EbookDraft(common("Guide"), null), null))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("fichier est obligatoire");

        assertThatThrownBy(() -> service.createEbook(new EbookDraft(common("Guide"), null),
                new MockMultipartFile("file", "vide.pdf", "application/pdf", new byte[0])))
                .isInstanceOf(BadRequestException.class);
    }

    @ParameterizedTest
    @ValueSource(strings = {"text/html", "image/svg+xml", "application/javascript", "application/zip"})
    @DisplayName("anything a browser could execute is not a document")
    void refusesExecutableUploads(String contentType) {
        MockMultipartFile hostile = new MockMultipartFile("file", "x", contentType, "<script>".getBytes());

        assertThatThrownBy(() -> service.createEbook(new EbookDraft(common("Guide"), null), hostile))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Format non accepté");
        verify(storage, never()).store(any(), any(), any());
    }

    @ParameterizedTest
    @ValueSource(strings = {
            "application/pdf",
            "application/epub+zip",
            "application/msword",
            "application/vnd.oasis.opendocument.text"})
    @DisplayName("the document formats an author actually uses are accepted")
    void acceptsDocumentFormats(String contentType) {
        when(storage.store(any(), any(), any())).thenReturn("ebooks/k");

        assertThat(service.createEbook(new EbookDraft(common("Guide"), null),
                new MockMultipartFile("file", "g", contentType, "x".getBytes()))).isNotNull();
    }

    // ── Updating ──────────────────────────────────────────────────────────────

    @Test
    @DisplayName("editing a video as if it were an article is refused by name")
    void refusesEditingTheWrongKind() {
        ResourceVideo video = new ResourceVideo();
        video.setId(1L);
        when(resources.findById(1L)).thenReturn(Optional.of(video));

        assertThatThrownBy(() -> service.updateArticle(1L, new ArticleDraft(common("T"), BODY, null)))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("article");
    }

    @Test
    @DisplayName("editing a resource never moves its slug")
    void updateKeepsTheSlug() {
        ResourceVideo video = new ResourceVideo();
        video.setId(1L);
        video.setSlug("intro-spring");
        when(resources.findById(1L)).thenReturn(Optional.of(video));

        Resource updated = service.updateVideo(1L,
                new VideoDraft(common("Introduction à Spring Boot"), "https://y/2", null));

        assertThat(updated.getSlug()).isEqualTo("intro-spring");
        assertThat(updated.getTitle()).isEqualTo("Introduction à Spring Boot");
    }

    // ── State and cleanup ─────────────────────────────────────────────────────

    @Test
    @DisplayName("publishing is its own act")
    void publishingIsSeparate() {
        ResourceVideo video = new ResourceVideo();
        video.setId(1L);
        when(resources.findById(1L)).thenReturn(Optional.of(video));

        assertThat(service.setPublished(1L, true).isPublished()).isTrue();
        assertThat(service.setPublished(1L, false).isPublished()).isFalse();
    }

    @Test
    @DisplayName("deleting an ebook removes its file, not just its row")
    void deletingAnEbookRemovesTheFile() {
        ResourceEbook ebook = new ResourceEbook();
        ebook.setId(1L);
        ebook.setFileKey("ebooks/abc.pdf");
        when(resources.findById(1L)).thenReturn(Optional.of(ebook));

        service.delete(1L);

        // Otherwise storage fills with files nothing points at any more.
        verify(storage).delete("ebooks/abc.pdf");
        verify(resources).delete(ebook);
    }

    @Test
    @DisplayName("deleting a video touches no storage: there is no file to remove")
    void deletingAVideoTouchesNoStorage() {
        ResourceVideo video = new ResourceVideo();
        video.setId(1L);
        when(resources.findById(1L)).thenReturn(Optional.of(video));

        service.delete(1L);

        verify(storage, never()).delete(any());
    }

    @Test
    @DisplayName("a resource that does not exist is not found")
    void refusesUnknownResources() {
        when(resources.findById(999L)).thenReturn(Optional.empty());
        when(resources.findBySlug("absent")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.require(999L)).isInstanceOf(NotFoundException.class);
        assertThatThrownBy(() -> service.requireBySlug("absent")).isInstanceOf(NotFoundException.class);
        assertThatThrownBy(() -> service.delete(999L)).isInstanceOf(NotFoundException.class);
    }

    // ── Search ────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("an empty search term is no filter, not a search for nothing")
    void blankSearchIsNoFilter() {
        service.search(null, null, null, "   ", PageRequest.of(0, 10));

        verify(resources).search(isNull(), isNull(), isNull(), isNull(), any());
    }

    @Test
    @DisplayName("an empty tag list is no filter either")
    void emptyTagListIsNoFilter() {
        service.search(null, null, Set.of(), null, PageRequest.of(0, 10));

        verify(resources).search(isNull(), isNull(), isNull(), isNull(), any());
    }

    @Test
    @DisplayName("a search term is trimmed before it reaches the query")
    void trimsTheSearchTerm() {
        service.search(ResourceKind.VIDEO, 1L, Set.of(2L), "  spring  ", PageRequest.of(0, 10));

        verify(resources).search(eq(ResourceKind.VIDEO), eq(1L), eq(Set.of(2L)), eq("spring"), any());
    }

    @Test
    @DisplayName("counting a view goes straight to the update, without loading the row")
    void recordViewDoesNotLoadTheRow() {
        service.recordView(1L);

        verify(resources).recordView(1L);
        verify(resources, never()).findById(any());
    }
}
