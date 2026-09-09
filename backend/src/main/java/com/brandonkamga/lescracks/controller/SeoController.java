package com.brandonkamga.lescracks.controller;

import com.brandonkamga.lescracks.domain.Resource;
import com.brandonkamga.lescracks.domain.ResourceStatus;
import com.brandonkamga.lescracks.dto.resource.ResourceResponse;
import com.brandonkamga.lescracks.exception.NotFoundException;
import com.brandonkamga.lescracks.mapper.ResourceMapper;
import com.brandonkamga.lescracks.repository.ArticleRepository;
import com.brandonkamga.lescracks.seo.SeoHtml;
import com.brandonkamga.lescracks.service.interfaces.ResourceService;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/seo")
public class SeoController {

    private final ResourceService resources;
    private final ResourceMapper mapper;
    private final ArticleRepository articles;
    private final ObjectMapper objectMapper;
    private static final DateTimeFormatter ISO = DateTimeFormatter.ISO_OFFSET_DATE_TIME;

    public SeoController(ResourceService resources, ResourceMapper mapper,
                         ArticleRepository articles, ObjectMapper objectMapper) {
        this.resources = resources;
        this.mapper = mapper;
        this.articles = articles;
        this.objectMapper = objectMapper;
    }

    @GetMapping(value = "/ressources/{slug}", produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<String> resource(@PathVariable String slug, HttpServletRequest request) {
        if ("articles".equals(slug)) {
            return ResponseEntity.ok(articleList(request));
        }

        long id;
        try {
            id = Long.parseLong(slug);
        } catch (NumberFormatException e) {
            throw new NotFoundException("Resource", "slug", slug);
        }

        Resource resource = resources.requirePublished(id);
        ResourceResponse response = mapper.toResponse(resource);
        String canonical = canonical(request, "/ressources/" + id);
        String html = buildDetail(response, canonical, request);
        return ResponseEntity.ok(html);
    }

    private String buildDetail(ResourceResponse resource, String canonical, HttpServletRequest request) {
        SeoHtml html = new SeoHtml(
                resource.title() + " — LesCracks",
                resource.description(),
                canonical)
                .image(resource.coverImage());

        html.heading(resource.title());
        html.paragraph(resource.description());

        if ("ARTICLE".equals(resource.kind())) {
            html.fact("Type", "Article");
            html.fact("Catégorie", resource.categoryName());
            html.fact("Temps de lecture", resource.readingMinutes() + " min");

            String prose = articles.findByResourceId(resource.id())
                    .map(com.brandonkamga.lescracks.domain.Article::getPlainText)
                    .orElse(null);
            if (prose != null && !prose.isBlank()) {
                for (String paragraph : prose.split("\n\n+")) {
                    html.paragraph(paragraph);
                }
            }

            Map<String, Object> jsonLd = new LinkedHashMap<>();
            jsonLd.put("@context", "https://schema.org");
            jsonLd.put("@type", "Article");
            jsonLd.put("headline", resource.title());
            jsonLd.put("description", resource.description());
            jsonLd.put("image", resource.coverImage());
            jsonLd.put("url", canonical);
            jsonLd.put("datePublished", ISO.format(resource.createdAt().atOffset(ZoneOffset.UTC)));
            jsonLd.put("author", Map.of("@type", "Organization", "name", "LesCracks"));
            html.jsonLd(writeJson(jsonLd));
        } else if ("EBOOK".equals(resource.kind())) {
            html.fact("Type", "Ebook");
            html.fact("Format", resource.fileFormat());

            Map<String, Object> jsonLd = new LinkedHashMap<>();
            jsonLd.put("@context", "https://schema.org");
            jsonLd.put("@type", "LearningResource");
            jsonLd.put("name", resource.title());
            jsonLd.put("description", resource.description());
            jsonLd.put("image", resource.coverImage());
            jsonLd.put("url", canonical);
            jsonLd.put("learningResourceType", "Ebook");
            html.jsonLd(writeJson(jsonLd));
        } else if ("EXTERNAL_VIDEO".equals(resource.kind())) {
            html.fact("Type", "Vidéo");
            html.fact("Plateforme", resource.platform());

            Map<String, Object> jsonLd = new LinkedHashMap<>();
            jsonLd.put("@context", "https://schema.org");
            jsonLd.put("@type", "LearningResource");
            jsonLd.put("name", resource.title());
            jsonLd.put("description", resource.description());
            jsonLd.put("image", resource.coverImage());
            jsonLd.put("url", canonical);
            jsonLd.put("learningResourceType", "Video");
            html.jsonLd(writeJson(jsonLd));
        }

        return html.render();
    }

    private String articleList(HttpServletRequest request) {
        var articles = resources.search(ResourceStatus.PUBLISHED, null, "ARTICLE", null, null, PageRequest.of(0, 100));
        String canonical = canonical(request, "/ressources/articles");

        SeoHtml html = new SeoHtml(
                "Articles — LesCracks",
                "Articles de la bibliothèque LesCracks pour apprendre la tech en français.",
                canonical);

        html.heading("Articles");
        html.paragraph("Articles de la bibliothèque LesCracks pour apprendre la tech en français.");

        List<SeoHtml.Link> links = new ArrayList<>();
        articles.forEach(resource -> {
            ResourceResponse response = mapper.toResponse(resource);
            links.add(new SeoHtml.Link(
                    canonical(request, "/ressources/" + response.id()),
                    response.title()));
        });
        html.links("Derniers articles", links);

        List<Map<String, Object>> items = new ArrayList<>();
        articles.forEach(resource -> {
            ResourceResponse response = mapper.toResponse(resource);
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("@type", "ListItem");
            item.put("position", items.size() + 1);
            item.put("url", canonical(request, "/ressources/" + response.id()));
            item.put("name", response.title());
            items.add(item);
        });

        Map<String, Object> jsonLd = new LinkedHashMap<>();
        jsonLd.put("@context", "https://schema.org");
        jsonLd.put("@type", "CollectionPage");
        jsonLd.put("name", "Articles — LesCracks");
        jsonLd.put("url", canonical);
        jsonLd.put("mainEntity", Map.of("@type", "ItemList", "itemListElement", items));
        html.jsonLd(writeJson(jsonLd));

        return html.render();
    }

    private String canonical(HttpServletRequest request, String path) {
        String scheme = request.getScheme();
        String host = request.getServerName();
        int port = request.getServerPort();
        if (("http".equals(scheme) && port == 80) || ("https".equals(scheme) && port == 443)) {
            return scheme + "://" + host + path;
        }
        return scheme + "://" + host + ":" + port + path;
    }

    private String writeJson(Map<String, Object> value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (Exception e) {
            throw new IllegalStateException("Cannot render JSON-LD", e);
        }
    }
}
