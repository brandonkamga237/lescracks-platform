package com.brandonkamga.lescracks.service;

import com.brandonkamga.lescracks.domain.Media;
import com.brandonkamga.lescracks.exception.BadRequestException;
import com.brandonkamga.lescracks.exception.NotFoundException;
import com.brandonkamga.lescracks.repository.MediaRepository;
import com.brandonkamga.lescracks.service.impl.MediaServiceImpl;
import com.brandonkamga.lescracks.service.interfaces.StorageService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.time.Duration;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Images people upload.
 *
 * This is the one endpoint that accepts a file from outside, so its refusals are a security
 * boundary rather than a convenience. SVG is the case worth naming: browsers render it as a
 * picture, it can carry script, and it would be served from our own origin.
 */
@ExtendWith(MockitoExtension.class)
class MediaServiceTest {

    @Mock
    MediaRepository mediaRepository;

    @Mock
    StorageService storage;

    MediaServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new MediaServiceImpl(mediaRepository, storage, "/api/media");
    }

    /** A real PNG, so the dimension reader has something to read. */
    private static byte[] png(int width, int height) throws Exception {
        BufferedImage image = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        ImageIO.write(image, "png", out);
        return out.toByteArray();
    }

    private static MockMultipartFile file(String name, String type, byte[] content) {
        return new MockMultipartFile("file", name, type, content);
    }

    @Test
    @DisplayName("an accepted image is stored and its details recorded")
    void storesAnImage() throws Exception {
        byte[] content = png(800, 600);
        when(storage.store(any(), any(), any())).thenReturn("media/abc.png");
        when(mediaRepository.save(any())).thenAnswer(call -> call.getArgument(0));

        Media media = service.upload(file("photo.png", "image/png", content));

        assertThat(media.getObjectKey()).isEqualTo("media/abc.png");
        assertThat(media.getOriginalName()).isEqualTo("photo.png");
        assertThat(media.getSizeBytes()).isEqualTo(content.length);
    }

    @Test
    @DisplayName("dimensions are read from the bytes, so a page can reserve the space")
    void readsTheDimensions() throws Exception {
        when(storage.store(any(), any(), any())).thenReturn("media/abc.png");
        when(mediaRepository.save(any())).thenAnswer(call -> call.getArgument(0));

        Media media = service.upload(file("photo.png", "image/png", png(800, 600)));

        assertThat(media.getWidth()).isEqualTo(800);
        assertThat(media.getHeight()).isEqualTo(600);
    }

    @Test
    @DisplayName("bytes that are not a readable image still upload, without dimensions")
    void toleratesUnreadableDimensions() {
        when(storage.store(any(), any(), any())).thenReturn("media/abc.gif");
        when(mediaRepository.save(any())).thenAnswer(call -> call.getArgument(0));

        // Losing the dimensions costs a layout shift; refusing the upload costs the image.
        Media media = service.upload(file("photo.gif", "image/gif", "pas une image".getBytes()));

        assertThat(media.getWidth()).isNull();
        assertThat(media.getHeight()).isNull();
    }

    @Test
    @DisplayName("an empty file is refused")
    void refusesAnEmptyFile() {
        assertThatThrownBy(() -> service.upload(file("vide.png", "image/png", new byte[0])))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("vide");

        verify(storage, never()).store(any(), any(), any());
    }

    @Test
    @DisplayName("an image over 5 Mo is refused, and told by how much it may weigh")
    void refusesAnOversizedImage() {
        byte[] tooBig = new byte[5 * 1024 * 1024 + 1];

        assertThatThrownBy(() -> service.upload(file("grande.png", "image/png", tooBig)))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("5 Mo");
    }

    @ParameterizedTest
    @ValueSource(strings = {"image/svg+xml", "text/html", "application/pdf", "application/javascript"})
    @DisplayName("anything that is not a rendered picture is refused, SVG included")
    void refusesNonPictures(String contentType) {
        assertThatThrownBy(() -> service.upload(file("x", contentType, "<script>".getBytes())))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Format non accepté");

        verify(storage, never()).store(any(), any(), any());
    }

    @ParameterizedTest
    @ValueSource(strings = {"image/jpeg", "image/png", "image/webp", "image/gif"})
    @DisplayName("the four picture formats are accepted")
    void acceptsPictureFormats(String contentType) {
        when(storage.store(any(), any(), any())).thenReturn("media/k");
        when(mediaRepository.save(any())).thenAnswer(call -> call.getArgument(0));

        assertThat(service.upload(file("x", contentType, "bytes".getBytes()))).isNotNull();
    }

    @Test
    @DisplayName("the accepted formats are published, so a client can say so before uploading")
    void publishesTheAcceptedTypes() {
        assertThat(service.acceptedTypes())
                .containsExactlyInAnyOrder("image/jpeg", "image/png", "image/webp", "image/gif");
    }

    @Test
    @DisplayName("a url is built from the key, so storage can move without touching a row")
    void buildsTheUrlFromTheKey() {
        assertThat(service.urlFor(Media.builder().objectKey("media/abc.png").build()))
                .isEqualTo("/api/media/media/abc.png");
    }

    @Test
    @DisplayName("no media means no url, not a broken one")
    void nullMediaHasNoUrl() {
        assertThat(service.urlFor(null)).isNull();
    }

    @Test
    @DisplayName("the sweep removes the file as well as the row")
    void sweepRemovesFilesAndRows() {
        List<Media> orphans = List.of(
                Media.builder().id(1L).objectKey("media/a.png").build(),
                Media.builder().id(2L).objectKey("media/b.png").build());
        when(mediaRepository.findUnreferencedBefore(any())).thenReturn(orphans);

        assertThat(service.sweepUnreferenced(Duration.ofDays(7))).isEqualTo(2);

        // A row deleted without its file leaves storage growing invisibly.
        verify(storage).delete("media/a.png");
        verify(storage).delete("media/b.png");
        verify(mediaRepository).deleteAll(orphans);
    }

    @Test
    @DisplayName("a sweep with nothing to do touches nothing")
    void sweepWithNoOrphansDoesNothing() {
        when(mediaRepository.findUnreferencedBefore(any())).thenReturn(List.of());

        assertThat(service.sweepUnreferenced(Duration.ofDays(7))).isZero();
        verify(storage, never()).delete(any());
    }

    @Test
    @DisplayName("an image that does not exist is not found")
    void refusesUnknownMedia() {
        when(mediaRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.require(999L)).isInstanceOf(NotFoundException.class);
    }

    @Test
    @DisplayName("a known image is returned")
    void findsKnownMedia() {
        Media media = Media.builder().id(1L).objectKey("media/a.png").build();
        when(mediaRepository.findById(1L)).thenReturn(Optional.of(media));

        assertThat(service.require(1L)).isEqualTo(media);
    }
}
