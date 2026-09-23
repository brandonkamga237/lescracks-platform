package com.brandonkamga.lescracks.resource.domain;

import com.brandonkamga.lescracks.newsletter.domain.NewsletterService;
import com.brandonkamga.lescracks.resource.api.dto.EbookResourceRequest;
import com.brandonkamga.lescracks.resource.api.dto.VideoResourceRequest;
import com.brandonkamga.lescracks.resource.infra.ArticleRepository;
import com.brandonkamga.lescracks.resource.infra.DocumentRepository;
import com.brandonkamga.lescracks.resource.infra.EbookRepository;
import com.brandonkamga.lescracks.resource.infra.ExternalVideoReferenceRepository;
import com.brandonkamga.lescracks.resource.infra.ResourceRepository;
import com.brandonkamga.lescracks.shared.exception.BadRequestException;
import com.brandonkamga.lescracks.shared.exception.NotFoundException;
import com.brandonkamga.lescracks.storage.domain.StorageService;
import com.brandonkamga.lescracks.taxonomy.domain.Category;
import com.brandonkamga.lescracks.taxonomy.domain.TaxonomyService;
import com.brandonkamga.lescracks.taxonomy.infra.TagRepository;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import java.util.Optional;

import static com.brandonkamga.lescracks.resource.domain.ResourceFixtures.category;
import static com.brandonkamga.lescracks.resource.domain.ResourceFixtures.resource;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

/**
 * The business rules of the resource domain, with every collaborator mocked: no Spring, no
 * database, so these are the tests that stay cheap enough to run on every save.
 */
@ExtendWith(MockitoExtension.class)
class ResourceServiceTest {

    @Mock private ResourceRepository resources;
    @Mock private EbookRepository ebooks;
    @Mock private ExternalVideoReferenceRepository videos;
    @Mock private ArticleRepository articles;
    @Mock private DocumentRepository documents;
    @Mock private TagRepository tags;
    @Mock private StorageService storage;
    @Mock private TaxonomyService taxonomy;
    @Mock private NewsletterService newsletter;

    private ResourceServiceImpl service;
    private Category category;

    @BeforeEach
    void setUp() {
        ObjectMapper mapper = new ObjectMapper();
        service = new ResourceServiceImpl(resources, ebooks, videos, articles, documents, tags,
                storage, taxonomy, newsletter, new ArticleBody(mapper), mapper);
        category = category("Backend");
    }

    private VideoResourceRequest videoRequest(ResourceStatus status) {
        return new VideoResourceRequest("  Titre de la vidéo  ", "  Une description  ",
                "https://cdn.example/cover.png", 1L, null,
                "  https://youtu.be/abc  ", "  YouTube  ", status);
    }

    @Test
    @DisplayName("publishing a video notifies the subscribers, and trims what the admin typed")
    void createVideoPublished() {
        when(taxonomy.requireCategory(1L)).thenReturn(category);
        when(resources.existsBySlug("titre-de-la-video")).thenReturn(false);
        when(resources.save(any(Resource.class))).thenAnswer(call -> call.getArgument(0));

        Resource saved = service.createVideo(videoRequest(ResourceStatus.PUBLISHED), null);

        assertThat(saved.getTitle()).isEqualTo("Titre de la vidéo");
        assertThat(saved.getDescription()).isEqualTo("Une description");
        assertThat(saved.getSlug()).isEqualTo("titre-de-la-video");
        verify(newsletter).notifyResourceSubscribers(saved);

        ArgumentCaptor<ExternalVideoReference> video = ArgumentCaptor.forClass(ExternalVideoReference.class);
        verify(videos).save(video.capture());
        assertThat(video.getValue().getVideoUrl()).isEqualTo("https://youtu.be/abc");
        assertThat(video.getValue().getPlatform()).isEqualTo("YouTube");
    }

    @Test
    @DisplayName("a draft stays quiet: nobody is notified about something they cannot read")
    void createVideoDraftNotifiesNobody() {
        when(taxonomy.requireCategory(1L)).thenReturn(category);
        when(resources.save(any(Resource.class))).thenAnswer(call -> call.getArgument(0));

        Resource saved = service.createVideo(videoRequest(ResourceStatus.DRAFT), null);

        assertThat(saved.getStatus()).isEqualTo(ResourceStatus.DRAFT);
        verifyNoInteractions(newsletter);
    }

    @Test
    @DisplayName("a title already taken gets a numeric suffix, never a duplicate url")
    void slugIsMadeUnique() {
        when(taxonomy.requireCategory(1L)).thenReturn(category);
        when(resources.existsBySlug("titre-de-la-video")).thenReturn(true);
        when(resources.existsBySlug("titre-de-la-video-2")).thenReturn(false);
        when(resources.save(any(Resource.class))).thenAnswer(call -> call.getArgument(0));

        Resource saved = service.createVideo(videoRequest(ResourceStatus.DRAFT), null);

        assertThat(saved.getSlug()).isEqualTo("titre-de-la-video-2");
    }

    @Test
    void refusesAResourceWithNoCoverImageAtAll() {
        VideoResourceRequest request = new VideoResourceRequest("Titre", "Description", null, 1L,
                null, "https://youtu.be/abc", "YouTube", ResourceStatus.DRAFT);

        assertThatThrownBy(() -> service.createVideo(request, null))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("couverture est obligatoire");
        verify(resources, never()).save(any());
    }

    @Test
    void refusesACoverImageThatIsNotAnImage() {
        var pdf = new MockMultipartFile("coverImageFile", "cover.pdf", "application/pdf", "%PDF".getBytes());

        assertThatThrownBy(() -> service.createVideo(videoRequest(ResourceStatus.DRAFT), pdf))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("format image");
        verifyNoInteractions(storage);
    }

    @Test
    void refusesACoverImageOverFiveMegabytes() {
        var huge = new MockMultipartFile("coverImageFile", "cover.png", "image/png",
                new byte[5 * 1024 * 1024 + 1]);

        assertThatThrownBy(() -> service.createVideo(videoRequest(ResourceStatus.DRAFT), huge))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("5 Mo");
        verifyNoInteractions(storage);
    }

    @Test
    @DisplayName("an uploaded cover is stored and referenced through /api/files/")
    void storesTheUploadedCover() {
        when(taxonomy.requireCategory(1L)).thenReturn(category);
        when(resources.save(any(Resource.class))).thenAnswer(call -> call.getArgument(0));
        when(storage.store(anyString(), any(), anyString())).thenReturn("stored-key.png");
        var png = new MockMultipartFile("coverImageFile", "cover.png", "image/png", new byte[] {1, 2});

        Resource saved = service.createVideo(videoRequest(ResourceStatus.DRAFT), png);

        assertThat(saved.getCoverImage()).isEqualTo("/api/files/stored-key.png");
    }

    @Test
    void refusesAnEbookWithNoFile() {
        var request = new EbookResourceRequest("Titre", "Description", "https://cdn.example/c.png",
                1L, null, ResourceStatus.DRAFT);

        assertThatThrownBy(() -> service.createEbook(request, new MockMultipartFile("file", new byte[0]), null))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("fichier ebook est obligatoire");
    }

    @Test
    @DisplayName("a draft is invisible to the public routes, even by id")
    void requirePublishedHidesDrafts() {
        Resource draft = resource(category, "Brouillon", ResourceStatus.DRAFT);
        when(resources.findById(7L)).thenReturn(Optional.of(draft));

        assertThatThrownBy(() -> service.requirePublished(7L)).isInstanceOf(NotFoundException.class);
    }

    @Test
    @DisplayName("an old numeric url still resolves once the resource has a slug")
    void fallsBackFromSlugToId() {
        Resource published = resource(category, "Spring Boot", ResourceStatus.PUBLISHED);
        when(resources.findBySlug("12")).thenReturn(Optional.empty());
        when(resources.findById(12L)).thenReturn(Optional.of(published));

        assertThat(service.requireBySlugOrId("12")).isSameAs(published);
    }

    @Test
    void reportsAnUnknownSlugAsNotFound() {
        when(resources.findBySlug("inconnu")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.requireBySlugOrId("inconnu"))
                .isInstanceOf(NotFoundException.class)
                .hasMessageContaining("inconnu");
    }

    @Test
    @DisplayName("deleting drops the cover we host, and leaves an external one alone")
    void deleteRemovesOnlyOurOwnFiles() {
        Resource hosted = resource(category, "Hébergée", ResourceStatus.PUBLISHED);
        hosted.setId(5L);
        hosted.setCoverImage("/api/files/abc.png");
        when(resources.findById(5L)).thenReturn(Optional.of(hosted));
        when(ebooks.findByResourceId(5L)).thenReturn(Optional.empty());
        when(videos.findByResourceId(5L)).thenReturn(Optional.empty());
        when(articles.findByResourceId(5L)).thenReturn(Optional.empty());

        service.delete(5L);

        verify(storage).delete("abc.png");
        verify(resources).delete(hosted);
    }

    @Test
    void deleteLeavesAnExternalCoverAlone() {
        Resource external = resource(category, "Externe", ResourceStatus.PUBLISHED);
        external.setId(6L);
        when(resources.findById(6L)).thenReturn(Optional.of(external));
        when(ebooks.findByResourceId(6L)).thenReturn(Optional.empty());
        when(videos.findByResourceId(6L)).thenReturn(Optional.empty());
        when(articles.findByResourceId(6L)).thenReturn(Optional.empty());

        service.delete(6L);

        verify(storage, never()).delete(anyString());
    }
}
