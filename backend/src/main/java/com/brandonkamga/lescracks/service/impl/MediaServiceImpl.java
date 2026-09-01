package com.brandonkamga.lescracks.service.impl;

import com.brandonkamga.lescracks.domain.Media;
import com.brandonkamga.lescracks.exception.BadRequestException;
import com.brandonkamga.lescracks.exception.NotFoundException;
import com.brandonkamga.lescracks.repository.MediaRepository;
import com.brandonkamga.lescracks.service.interfaces.MediaService;
import com.brandonkamga.lescracks.service.interfaces.StorageService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Set;

@Service
@Transactional
public class MediaServiceImpl implements MediaService {

    private static final Logger log = LoggerFactory.getLogger(MediaServiceImpl.class);

    /**
     * Only formats a browser renders as a picture. SVG is excluded deliberately: it is a
     * document that can carry script, and it would be served from our own origin.
     */
    private static final Set<String> ACCEPTED = Set.of(
            "image/jpeg", "image/png", "image/webp", "image/gif");

    private static final long MAX_BYTES = 5L * 1024 * 1024;

    private final MediaRepository mediaRepository;
    private final StorageService storage;
    private final String publicBaseUrl;

    public MediaServiceImpl(MediaRepository mediaRepository, StorageService storage,
                            @Value("${app.media.base-url:/api/media}") String publicBaseUrl) {
        this.mediaRepository = mediaRepository;
        this.storage = storage;
        this.publicBaseUrl = publicBaseUrl;
    }

    @Override
    public Media upload(MultipartFile file) {
        byte[] content = validate(file);
        String key = storage.store(file.getOriginalFilename(), content, file.getContentType());

        Media media = Media.builder()
                .objectKey(key)
                .originalName(file.getOriginalFilename())
                .contentType(file.getContentType())
                .sizeBytes(content.length)
                .build();
        applyDimensions(media, content);
        return mediaRepository.save(media);
    }

    /** Every reason to refuse, in one place, each with a sentence the uploader can act on. */
    private byte[] validate(MultipartFile file) {
        if (file.isEmpty()) {
            throw new BadRequestException("Le fichier est vide.");
        }
        if (file.getSize() > MAX_BYTES) {
            throw new BadRequestException("L'image dépasse 5 Mo. Réduisez-la avant de l'envoyer.");
        }
        if (!ACCEPTED.contains(file.getContentType())) {
            throw new BadRequestException("Format non accepté. Utilisez JPEG, PNG, WebP ou GIF.");
        }
        try {
            return file.getBytes();
        } catch (Exception unreadable) {
            throw new BadRequestException("Le fichier n'a pas pu être lu.");
        }
    }

    /** Known dimensions let a page reserve the space before the bytes arrive, so nothing jumps. */
    private void applyDimensions(Media media, byte[] content) {
        try (var stream = new ByteArrayInputStream(content)) {
            BufferedImage image = ImageIO.read(stream);
            if (image != null) {
                media.setWidth(image.getWidth());
                media.setHeight(image.getHeight());
            }
        } catch (Exception unreadable) {
            log.debug("Dimensions unavailable for {}", media.getOriginalName());
        }
    }

    @Override
    @Transactional(readOnly = true)
    public Media require(Long id) {
        return mediaRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Media", "id", id));
    }

    @Override
    public String urlFor(Media media) {
        return media == null ? null : publicBaseUrl + "/" + media.getObjectKey();
    }

    @Override
    public int sweepUnreferenced(Duration olderThan) {
        List<Media> orphans = mediaRepository.findUnreferencedBefore(Instant.now().minus(olderThan));
        orphans.forEach(media -> storage.delete(media.getObjectKey()));
        mediaRepository.deleteAll(orphans);
        if (!orphans.isEmpty()) {
            log.info("Swept {} unreferenced image(s)", orphans.size());
        }
        return orphans.size();
    }

    @Override
    public List<String> acceptedTypes() {
        return List.copyOf(ACCEPTED);
    }
}
