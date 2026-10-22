package com.brandonkamga.lescracks.resource.domain;

import com.brandonkamga.lescracks.newsletter.application.Announcements;
import com.brandonkamga.lescracks.newsletter.application.ArticleNews;
import com.brandonkamga.lescracks.resource.infra.ArticleRepository;
import com.brandonkamga.lescracks.resource.infra.ResourceRepository;
import com.brandonkamga.lescracks.shared.exception.BadRequestException;
import com.brandonkamga.lescracks.shared.exception.NotFoundException;
import com.brandonkamga.lescracks.shared.scheduling.Schedules;
import com.brandonkamga.lescracks.shared.util.Slugs;
import com.brandonkamga.lescracks.storage.domain.StorageService;
import com.brandonkamga.lescracks.taxonomy.domain.Tag;
import com.brandonkamga.lescracks.taxonomy.domain.TaxonomyService;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

@Service
@Transactional
public class ResourceServiceImpl implements ResourceService {
    private final ResourceRepository resources;
    private final ArticleRepository articles;
    private final StorageService storage;
    private final TaxonomyService taxonomy;
    private final Announcements announcements;
    private final ArticleBody articleBody;
    private final ObjectMapper mapper;

    public ResourceServiceImpl(ResourceRepository resources, ArticleRepository articles,
                               StorageService storage, TaxonomyService taxonomy,
                               Announcements announcements, ArticleBody articleBody, ObjectMapper mapper) {
        this.resources = resources;
        this.articles = articles;
        this.storage = storage;
        this.taxonomy = taxonomy;
        this.announcements = announcements;
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
    public List<ThemeArticles> publishedThemes() {
        return resources.countByTheme(ResourceStatus.PUBLISHED);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<Resource> search(ResourceStatus status, String search, Long categoryId, Long tagId, Pageable pageable) {
        return resources.search(status, search == null || search.isBlank() ? null : search.trim(), categoryId, tagId, pageable);
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
    @Transactional(readOnly = true)
    public Resource requirePublishedBySlugOrId(String slugOrId) {
        Resource resource = findBySlugOrId(slugOrId);
        if (resource.getStatus() != ResourceStatus.PUBLISHED) {
            throw new NotFoundException("Resource", "slug", slugOrId);
        }
        return resource;
    }

    @Override
    @Transactional(readOnly = true)
    public Resource requireBySlugOrId(String slugOrId) {
        return findBySlugOrId(slugOrId);
    }

    private Resource findBySlugOrId(String slugOrId) {
        if (slugOrId == null || slugOrId.isBlank()) {
            throw new NotFoundException("Resource", "slug", slugOrId);
        }
        return resources.findBySlug(slugOrId)
                .or(() -> parseId(slugOrId).flatMap(resources::findById))
                .orElseThrow(() -> new NotFoundException("Resource", "slug", slugOrId));
    }

    private Optional<Long> parseId(String value) {
        try {
            return Optional.of(Long.parseLong(value));
        } catch (NumberFormatException ignored) {
            return Optional.empty();
        }
    }

    @Override
    public Resource createArticle(ArticleContent content, MultipartFile coverImageFile) {
        String coverImage = resolveCoverImage(content.coverImage(), coverImageFile, null);
        Resource resource = base(content.title(), content.description(), coverImage,
                content.categoryId(), content.status(), content.scheduledAt(), content.tagIds());
        Resource saved = resources.save(resource);
        persistArticle(saved, content.body());
        if (saved.getStatus() == ResourceStatus.PUBLISHED) announce(saved);
        return saved;
    }

    @Override
    public Resource updateArticle(Long id, ArticleContent content, MultipartFile coverImageFile) {
        Resource resource = require(id);
        ensureArticle(resource);
        String coverImage = resolveCoverImage(content.coverImage(), coverImageFile, resource.getCoverImage());
        apply(resource, content.title(), content.description(), coverImage, content.categoryId(), content.status(), content.scheduledAt(), content.tagIds());
        Article article = articles.findByResourceId(id).orElseThrow();
        persistArticleBody(article, content.body());
        return resource;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<Resource> all(Pageable pageable) { return resources.findAll(pageable); }

    @Override
    @Transactional(readOnly = true)
    public Optional<Article> article(Long resourceId) { return articles.findByResourceId(resourceId); }

    @Override
    public void delete(Long id) {
        Resource resource = require(id);
        deleteCoverImage(resource.getCoverImage());
        articles.findByResourceId(id).ifPresent(articles::delete);
        resources.delete(resource);
    }

    private void deleteCoverImage(String coverImage) {
        if (coverImage == null || !coverImage.startsWith("/api/files/")) return;
        String key = coverImage.substring("/api/files/".length());
        if (!key.isBlank()) storage.delete(key);
    }

    private Resource base(String title, String description, String coverImage, Long categoryId,
                          ResourceStatus status, Instant scheduledAt, Set<Long> tagIds) {
        Resource resource = Resource.builder().category(taxonomy.requireCategory(categoryId)).title(title.trim())
                .description(description.trim()).coverImage(coverImage.trim()).build();
        applyPublication(resource, status, scheduledAt);
        resource.setSlug(Slugs.uniqueFrom(resource.getTitle(), resources::existsBySlug));
        applyTags(resource, tagIds);
        return resources.save(resource);
    }

    private void apply(Resource resource, String title, String description, String coverImage,
                       Long categoryId, ResourceStatus status, Instant scheduledAt, Set<Long> tagIds) {
        resource.setTitle(title.trim());
        resource.setDescription(description.trim());
        resource.setCoverImage(coverImage.trim());
        resource.setCategory(taxonomy.requireCategory(categoryId));
        applyPublication(resource, status, scheduledAt);
        if (resource.getSlug() == null || resource.getSlug().isBlank()) {
            resource.setSlug(Slugs.uniqueFrom(resource.getTitle(), resources::existsBySlug));
        }
        applyTags(resource, tagIds);
    }

    /** A scheduled date keeps the resource a draft until the scheduler publishes it; no date cancels the schedule. */
    private void applyPublication(Resource resource, ResourceStatus status, Instant scheduledAt) {
        resource.setScheduledAt(Schedules.check(scheduledAt, resource.getScheduledAt()));
        if (resource.getScheduledAt() != null) {
            resource.setStatus(ResourceStatus.DRAFT);
        } else if (status != null) {
            resource.setStatus(status);
        }
        if (resource.getStatus() == ResourceStatus.PUBLISHED && resource.getPublishedAt() == null) {
            resource.setPublishedAt(Instant.now());
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<Long> dueForPublication(Instant now) {
        return resources.findScheduledIds(ResourceStatus.DRAFT, now);
    }

    @Override
    public boolean publishScheduled(Long id, Instant now) {
        Resource resource = resources.findById(id).orElse(null);
        if (resource == null || resource.getStatus() != ResourceStatus.DRAFT
                || resource.getScheduledAt() == null || resource.getScheduledAt().isAfter(now)) {
            return false;
        }
        resource.setStatus(ResourceStatus.PUBLISHED);
        resource.setScheduledAt(null);
        // Its publication day, not its drafting day, is what makes it "new" in the catalogue.
        resource.setPublishedAt(now);
        resource.setUpdatedAt(now);
        return true;
    }

    @Override
    public void announce(Long id) {
        announce(require(id));
    }

    private void announce(Resource resource) {
        String page = "/blog/" + (resource.getSlug() != null ? resource.getSlug() : resource.getId());
        announcements.announceArticle(new ArticleNews(resource.getTitle(), resource.getDescription(), page, resource.getCoverImage()));
    }

    private void applyTags(Resource resource, Set<Long> tagIds) {
        if (tagIds == null) return;
        Set<Tag> selected = taxonomy.requireAll(tagIds);
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
