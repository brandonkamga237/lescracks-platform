package com.brandonkamga.lescracks.service.impl;

import com.brandonkamga.lescracks.domain.*;
import com.brandonkamga.lescracks.dto.resource.ArticleResourceRequest;
import com.brandonkamga.lescracks.dto.resource.EbookResourceRequest;
import com.brandonkamga.lescracks.dto.resource.VideoResourceRequest;
import com.brandonkamga.lescracks.exception.BadRequestException;
import com.brandonkamga.lescracks.exception.NotFoundException;
import com.brandonkamga.lescracks.repository.*;
import com.brandonkamga.lescracks.service.interfaces.ResourceService;
import com.brandonkamga.lescracks.service.interfaces.StorageService;
import com.brandonkamga.lescracks.service.interfaces.TaxonomyService;
import com.brandonkamga.lescracks.service.interfaces.NewsletterService;
import com.brandonkamga.lescracks.util.ArticleBody;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

@Service
@Transactional
public class ResourceServiceImpl implements ResourceService {
    private final ResourceRepository resources;
    private final EbookRepository ebooks;
    private final ExternalVideoReferenceRepository videos;
    private final ArticleRepository articles;
    private final DocumentRepository documents;
    private final TagRepository tags;
    private final StorageService storage;
    private final TaxonomyService taxonomy;
    private final NewsletterService newsletter;
    private final ArticleBody articleBody;
    private final ObjectMapper mapper;

    public ResourceServiceImpl(ResourceRepository resources, EbookRepository ebooks,
                               ExternalVideoReferenceRepository videos, ArticleRepository articles,
                               DocumentRepository documents, TagRepository tags,
                               StorageService storage, TaxonomyService taxonomy,
                               NewsletterService newsletter, ArticleBody articleBody, ObjectMapper mapper) {
        this.resources = resources;
        this.ebooks = ebooks;
        this.videos = videos;
        this.articles = articles;
        this.documents = documents;
        this.tags = tags;
        this.storage = storage;
        this.taxonomy = taxonomy;
        this.newsletter = newsletter;
        this.articleBody = articleBody;
        this.mapper = mapper;
    }

    @Override
    @Transactional(readOnly = true)
    public List<Resource> published() {
        return resources.findByStatusOrderByCreatedAtDesc(ResourceStatus.PUBLISHED);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<Resource> search(ResourceStatus status, String search, String kind, Long categoryId, Long tagId, Pageable pageable) {
        return resources.search(status, search == null || search.isBlank() ? null : search.trim(),
                kind == null || kind.isBlank() ? null : kind.trim().toUpperCase(), categoryId, tagId, pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public Resource requirePublished(Long id) {
        return resources.findById(id)
                .filter(resource -> resource.getStatus() == ResourceStatus.PUBLISHED)
                .orElseThrow(() -> new NotFoundException("Resource", "id", id));
    }

    @Override
    @Transactional(readOnly = true)
    public Resource require(Long id) {
        return resources.findById(id).orElseThrow(() -> new NotFoundException("Resource", "id", id));
    }

    @Override
    public Resource createVideo(VideoResourceRequest request, MultipartFile coverImageFile) {
        String coverImage = resolveCoverImage(request.coverImage(), coverImageFile, null);
        Resource resource = base(request.title(), request.description(), coverImage,
                request.categoryId(), request.status(), request.tagIds());
        Resource saved = resources.save(resource);
        videos.save(ExternalVideoReference.builder().resource(saved)
                .videoUrl(request.videoUrl().trim()).platform(request.platform().trim()).build());
        if (saved.getStatus() == ResourceStatus.PUBLISHED) newsletter.notifyResourceSubscribers(saved);
        return saved;
    }

    @Override
    public Resource updateVideo(Long id, VideoResourceRequest request, MultipartFile coverImageFile) {
        Resource resource = require(id);
        ensureVideo(resource);
        String coverImage = resolveCoverImage(request.coverImage(), coverImageFile, resource.getCoverImage());
        apply(resource, request.title(), request.description(), coverImage, request.categoryId(), request.status(), request.tagIds());
        ExternalVideoReference video = videos.findByResourceId(id).orElseThrow();
        video.setVideoUrl(request.videoUrl().trim());
        video.setPlatform(request.platform().trim());
        return resource;
    }

    @Override
    public Resource createEbook(EbookResourceRequest request, MultipartFile file, MultipartFile coverImageFile) {
        validateFile(file);
        String coverImage = resolveCoverImage(request.coverImage(), coverImageFile, null);
        Resource resource = base(request.title(), request.description(), coverImage,
                request.categoryId(), request.status(), request.tagIds());
        Resource saved = resources.save(resource);
        try {
            String key = storage.store(file.getOriginalFilename(), file.getBytes(), file.getContentType());
            Document document = documents.save(Document.builder().file(key)
                    .format(file.getContentType() == null ? "application/octet-stream" : file.getContentType())
                    .fileSize(file.getSize()).build());
            ebooks.save(Ebook.builder().resource(saved).document(document).build());
            if (saved.getStatus() == ResourceStatus.PUBLISHED) newsletter.notifyResourceSubscribers(saved);
            return saved;
        } catch (IOException exception) {
            throw new BadRequestException("Le fichier ebook n'a pas pu être lu.");
        }
    }

    @Override
    public Resource updateEbook(Long id, EbookResourceRequest request, MultipartFile file, MultipartFile coverImageFile) {
        Resource resource = require(id);
        ensureEbook(resource);
        String coverImage = resolveCoverImage(request.coverImage(), coverImageFile, resource.getCoverImage());
        apply(resource, request.title(), request.description(), coverImage, request.categoryId(), request.status(), request.tagIds());
        if (file != null && !file.isEmpty()) {
            Ebook ebook = ebooks.findByResourceId(id).orElseThrow();
            Document old = ebook.getDocument();
            try {
                String key = storage.store(file.getOriginalFilename(), file.getBytes(), file.getContentType());
                old.setFile(key);
                old.setFormat(file.getContentType() == null ? "application/octet-stream" : file.getContentType());
                old.setFileSize(file.getSize());
            } catch (IOException exception) {
                throw new BadRequestException("Le fichier ebook n'a pas pu être lu.");
            }
        }
        return resource;
    }

    @Override
    public Resource createArticle(ArticleResourceRequest request, MultipartFile coverImageFile) {
        String coverImage = resolveCoverImage(request.coverImage(), coverImageFile, null);
        Resource resource = base(request.title(), request.description(), coverImage,
                request.categoryId(), request.status(), request.tagIds());
        Resource saved = resources.save(resource);
        persistArticle(saved, request.body());
        if (saved.getStatus() == ResourceStatus.PUBLISHED) newsletter.notifyResourceSubscribers(saved);
        return saved;
    }

    @Override
    public Resource updateArticle(Long id, ArticleResourceRequest request, MultipartFile coverImageFile) {
        Resource resource = require(id);
        ensureArticle(resource);
        String coverImage = resolveCoverImage(request.coverImage(), coverImageFile, resource.getCoverImage());
        apply(resource, request.title(), request.description(), coverImage, request.categoryId(), request.status(), request.tagIds());
        Article article = articles.findByResourceId(id).orElseThrow();
        persistArticleBody(article, request.body());
        return resource;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<Resource> all(Pageable pageable) { return resources.findAll(pageable); }

    @Override
    public void delete(Long id) {
        Resource resource = require(id);
        deleteCoverImage(resource.getCoverImage());
        ebooks.findByResourceId(id).ifPresent(ebook -> {
            storage.delete(ebook.getDocument().getFile());
            ebooks.delete(ebook);
            documents.delete(ebook.getDocument());
        });
        videos.findByResourceId(id).ifPresent(videos::delete);
        articles.findByResourceId(id).ifPresent(articles::delete);
        resources.delete(resource);
    }

    private void deleteCoverImage(String coverImage) {
        if (coverImage == null || !coverImage.startsWith("/api/files/")) return;
        String key = coverImage.substring("/api/files/".length());
        if (!key.isBlank()) storage.delete(key);
    }

    private Resource base(String title, String description, String coverImage, Long categoryId,
                          ResourceStatus status, Set<Long> tagIds) {
        Resource resource = Resource.builder().category(taxonomy.requireCategory(categoryId)).title(title.trim())
                .description(description.trim()).coverImage(coverImage.trim())
                .status(status == null ? ResourceStatus.DRAFT : status).build();
        applyTags(resource, tagIds);
        return resources.save(resource);
    }

    private void apply(Resource resource, String title, String description, String coverImage,
                       Long categoryId, ResourceStatus status, Set<Long> tagIds) {
        resource.setTitle(title.trim());
        resource.setDescription(description.trim());
        resource.setCoverImage(coverImage.trim());
        resource.setCategory(taxonomy.requireCategory(categoryId));
        resource.setStatus(status == null ? resource.getStatus() : status);
        applyTags(resource, tagIds);
    }

    private void applyTags(Resource resource, Set<Long> tagIds) {
        if (tagIds == null) return;
        Set<Tag> selected = new HashSet<>(tags.findAllById(tagIds));
        resource.getTags().clear();
        resource.getTags().addAll(selected);
    }

    private String resolveCoverImage(String coverImageUrl, MultipartFile coverImageFile, String existingCoverImage) {
        if (coverImageFile != null && !coverImageFile.isEmpty()) {
            validateImage(coverImageFile);
            try {
                String key = storage.store(coverImageFile.getOriginalFilename(), coverImageFile.getBytes(), coverImageFile.getContentType());
                return "/api/files/" + key;
            } catch (IOException exception) {
                throw new BadRequestException("L'image de couverture n'a pas pu être lue.");
            }
        }
        if (coverImageUrl != null && !coverImageUrl.isBlank()) return coverImageUrl;
        if (existingCoverImage != null && !existingCoverImage.isBlank()) return existingCoverImage;
        throw new BadRequestException("L'image de couverture est obligatoire.");
    }

    private void validateImage(MultipartFile file) {
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new BadRequestException("L'image de couverture doit être au format image (jpg, png, webp, …).");
        }
        if (file.getSize() > 5 * 1024 * 1024) {
            throw new BadRequestException("L'image de couverture ne doit pas dépasser 5 Mo.");
        }
    }

    private void ensureVideo(Resource resource) {
        if (!videos.existsById(resource.getId())) throw new BadRequestException("Cette ressource n'est pas une vidéo externe.");
    }

    private void ensureEbook(Resource resource) {
        if (!ebooks.existsById(resource.getId())) throw new BadRequestException("Cette ressource n'est pas un ebook.");
    }

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) throw new BadRequestException("Le fichier ebook est obligatoire.");
    }

    private void persistArticle(Resource resource, com.fasterxml.jackson.databind.JsonNode body) {
        Article article = Article.builder().resource(resource).body(body).build();
        persistArticleBody(article, body);
        articles.save(article);
    }

    private void persistArticleBody(Article article, com.fasterxml.jackson.databind.JsonNode body) {
        String bodyJson = toJson(body);
        article.setBody(body);
        article.setPlainText(articleBody.toPlainText(bodyJson));
        article.setReadingMinutes(articleBody.readingMinutes(article.getPlainText()));
    }

    private String toJson(com.fasterxml.jackson.databind.JsonNode body) {
        try {
            return mapper.writeValueAsString(body);
        } catch (JsonProcessingException malformed) {
            throw new BadRequestException("Le corps de l'article n'est pas un JSON valide.");
        }
    }

    private void ensureArticle(Resource resource) {
        if (!articles.existsById(resource.getId())) throw new BadRequestException("Cette ressource n'est pas un article.");
    }
}
