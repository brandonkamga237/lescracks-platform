package com.brandonkamga.lescracks.service.impl;

import com.brandonkamga.lescracks.domain.*;
import com.brandonkamga.lescracks.exception.BadRequestException;
import com.brandonkamga.lescracks.exception.NotFoundException;
import com.brandonkamga.lescracks.repository.MediaRepository;
import com.brandonkamga.lescracks.repository.ResourceRepository;
import com.brandonkamga.lescracks.service.interfaces.MediaService;
import com.brandonkamga.lescracks.service.interfaces.ResourceService;
import com.brandonkamga.lescracks.service.interfaces.StorageService;
import com.brandonkamga.lescracks.service.interfaces.TaxonomyService;
import com.brandonkamga.lescracks.util.ArticleBody;
import com.brandonkamga.lescracks.util.Slugs;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.Collection;
import java.util.HashSet;
import java.util.Set;

@Service
@Transactional
public class ResourceServiceImpl implements ResourceService {

    /** Document formats an ebook may be. Anything a browser executes is not on the list. */
    private static final Set<String> EBOOK_TYPES = Set.of(
            "application/pdf",
            "application/epub+zip",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.oasis.opendocument.text");

    private final ResourceRepository resources;
    private final MediaRepository mediaRepository;
    private final MediaService media;
    private final TaxonomyService taxonomy;
    private final StorageService storage;
    private final ArticleBody articleBody;

    public ResourceServiceImpl(ResourceRepository resources, MediaRepository mediaRepository,
                               MediaService media, TaxonomyService taxonomy,
                               StorageService storage, ArticleBody articleBody) {
        this.resources = resources;
        this.mediaRepository = mediaRepository;
        this.media = media;
        this.taxonomy = taxonomy;
        this.storage = storage;
        this.articleBody = articleBody;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<Resource> search(ResourceKind kind, Long categoryId, Collection<Long> tagIds,
                                 String search, Pageable pageable) {
        Collection<Long> tags = (tagIds == null || tagIds.isEmpty()) ? null : tagIds;
        String term = (search == null || search.isBlank()) ? null : search.strip();
        return resources.search(kind, categoryId, tags, term, pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<Resource> all(Pageable pageable) {
        return resources.findAll(pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public Resource requireBySlug(String slug) {
        return resources.findBySlug(slug)
                .orElseThrow(() -> new NotFoundException("Resource", "slug", slug));
    }

    @Override
    @Transactional(readOnly = true)
    public Resource require(Long id) {
        return resources.findById(id)
                .orElseThrow(() -> new NotFoundException("Resource", "id", id));
    }

    // ── Creating ──────────────────────────────────────────────────────────────

    @Override
    public Resource createVideo(VideoDraft draft) {
        ResourceVideo video = new ResourceVideo();
        video.setSlug(newSlug(draft.common()));
        applyCommon(video, draft.common());
        applyVideo(video, draft);
        return resources.save(video);
    }

    @Override
    public Resource createEbook(EbookDraft draft, MultipartFile file) {
        byte[] content = readEbook(file);
        ResourceEbook ebook = new ResourceEbook();
        ebook.setSlug(newSlug(draft.common()));
        applyCommon(ebook, draft.common());
        ebook.setFileKey(storage.store(file.getOriginalFilename(), content, file.getContentType()));
        ebook.setOriginalName(file.getOriginalFilename());
        ebook.setContentType(file.getContentType());
        ebook.setSizeBytes(content.length);
        ebook.setPageCount(draft.pageCount());
        return resources.save(ebook);
    }

    @Override
    public Resource createArticle(ArticleDraft draft) {
        ResourceArticle article = new ResourceArticle();
        article.setSlug(newSlug(draft.common()));
        applyCommon(article, draft.common());
        applyArticle(article, draft);
        return resources.save(article);
    }

    // ── Updating ──────────────────────────────────────────────────────────────

    @Override
    public Resource updateVideo(Long id, VideoDraft draft) {
        ResourceVideo video = requireOfKind(id, ResourceVideo.class, "vidéo");
        applyCommon(video, draft.common());
        applyVideo(video, draft);
        return video;
    }

    @Override
    public Resource updateArticle(Long id, ArticleDraft draft) {
        ResourceArticle article = requireOfKind(id, ResourceArticle.class, "article");
        applyCommon(article, draft.common());
        applyArticle(article, draft);
        return article;
    }

    // ── Shared steps ──────────────────────────────────────────────────────────

    private String newSlug(Common common) {
        requireText(common.title(), "Le titre est obligatoire.");
        return Slugs.uniqueFrom(common.title(), resources::existsBySlug);
    }

    /** What every kind sets, in one place, so the three creates cannot drift apart. */
    private void applyCommon(Resource resource, Common common) {
        requireText(common.title(), "Le titre est obligatoire.");
        resource.setTitle(common.title().strip());
        resource.setSummary(common.summary());
        resource.setCategory(taxonomy.requireCategory(common.categoryId()));
        resource.setTags(taxonomy.requireAll(common.tagIds()));
        resource.setCover(common.coverId() == null ? null : media.require(common.coverId()));
    }

    private void applyVideo(ResourceVideo video, VideoDraft draft) {
        requireText(draft.externalUrl(), "Le lien de la vidéo est obligatoire.");
        video.setExternalUrl(draft.externalUrl().strip());
        video.setDurationSeconds(draft.durationSeconds());
    }

    /**
     * Saving an article derives everything that can be derived: its prose, its reading time,
     * and which images it uses. None of the three is asked of the caller, so none can be
     * supplied wrongly or forgotten.
     */
    private void applyArticle(ResourceArticle article, ArticleDraft draft) {
        requireText(draft.body(), "Le contenu de l'article est obligatoire.");
        String plainText = articleBody.toPlainText(draft.body());
        if (plainText.isBlank()) {
            throw new BadRequestException("L'article ne contient aucun texte.");
        }
        article.setBody(draft.body());
        article.setBodyText(plainText);
        article.setReadingMinutes(articleBody.readingMinutes(plainText));
        article.setAuthorName(draft.authorName());
        article.setMedia(new HashSet<>(mediaRepository.findAllById(articleBody.mediaIds(draft.body()))));
    }

    private byte[] readEbook(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Le fichier est obligatoire pour un ebook.");
        }
        if (!EBOOK_TYPES.contains(file.getContentType())) {
            throw new BadRequestException("Format non accepté. Utilisez PDF, EPUB, Word ou OpenDocument.");
        }
        try {
            return file.getBytes();
        } catch (Exception unreadable) {
            throw new BadRequestException("Le fichier n'a pas pu être lu.");
        }
    }

    /** Editing a video as if it were an article is a caller mistake worth naming. */
    private <T extends Resource> T requireOfKind(Long id, Class<T> type, String label) {
        Resource resource = require(id);
        if (!type.isInstance(resource)) {
            throw new BadRequestException("Cette ressource n'est pas " + (label.equals("article") ? "un " : "une ") + label + ".");
        }
        return type.cast(resource);
    }

    private void requireText(String value, String message) {
        if (value == null || value.isBlank()) {
            throw new BadRequestException(message);
        }
    }

    // ── State ─────────────────────────────────────────────────────────────────

    @Override
    public Resource setPublished(Long id, boolean published) {
        Resource resource = require(id);
        resource.setPublished(published);
        return resource;
    }

    @Override
    public void delete(Long id) {
        Resource resource = require(id);
        if (resource instanceof ResourceEbook ebook) {
            storage.delete(ebook.getFileKey());
        }
        resources.delete(resource);
    }

    @Override
    public void recordView(Long id) {
        resources.recordView(id);
    }
}
