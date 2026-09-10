package com.brandonkamga.lescracks.controller;

import com.brandonkamga.lescracks.domain.Event;
import com.brandonkamga.lescracks.domain.EventFormat;
import com.brandonkamga.lescracks.domain.EventStatus;
import com.brandonkamga.lescracks.domain.Resource;
import com.brandonkamga.lescracks.domain.ResourceStatus;
import com.brandonkamga.lescracks.dto.resource.ResourceResponse;
import com.brandonkamga.lescracks.exception.NotFoundException;
import com.brandonkamga.lescracks.mapper.ResourceMapper;
import com.brandonkamga.lescracks.repository.ArticleRepository;
import com.brandonkamga.lescracks.seo.SeoHtml;
import com.brandonkamga.lescracks.service.interfaces.EventService;
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

    private static final DateTimeFormatter ISO = DateTimeFormatter.ISO_OFFSET_DATE_TIME;
    private static final String PREVIEW_IMAGE = "/preview.png";
    private static final int PREVIEW_WIDTH = 1296;
    private static final int PREVIEW_HEIGHT = 682;

    private final ResourceService resources;
    private final EventService events;
    private final ResourceMapper mapper;
    private final ArticleRepository articles;
    private final ObjectMapper objectMapper;

    private final Map<String, PageMeta> pageMeta = Map.of(
            "home", new PageMeta("LesCracks — Comprends la tech. Passe à la pratique.",
                    "Explore des vidéos, des ebooks et des événements pour développer tes compétences tech, à ton rythme. Une bibliothèque ouverte et une communauté francophone.",
                    "/", "Accueil"),
            "a-propos", new PageMeta("À propos — LesCracks",
                    "LesCracks, c’est une école en ligne tech pensée pour celles et ceux qui apprennent mieux en construisant, avec une communauté francophone.",
                    "/a-propos", "À propos"),
            "conditions-utilisation", new PageMeta("Conditions d’utilisation — LesCracks",
                    "Les conditions d’utilisation de la plateforme LesCracks.",
                    "/conditions-utilisation", "Conditions d’utilisation"),
            "politique-confidentialite", new PageMeta("Politique de confidentialité — LesCracks",
                    "Comment LesCracks protège et utilise tes données personnelles.",
                    "/politique-confidentialite", "Politique de confidentialité"),
            "evenements", new PageMeta("Événements et ateliers tech — LesCracks",
                    "Bootcamps, ateliers, webinaires et conférences : découvre les rendez-vous LesCracks pour apprendre et pratiquer ensemble.",
                    "/evenements", "Événements"),
            "ressources", new PageMeta("Bibliothèque — LesCracks",
                    "Ebooks et vidéos pour apprendre la tech en français. Filtre par format, catégorie et sujet.",
                    "/ressources", "Bibliothèque")
    );

    public SeoController(ResourceService resources, EventService events, ResourceMapper mapper,
                         ArticleRepository articles, ObjectMapper objectMapper) {
        this.resources = resources;
        this.events = events;
        this.mapper = mapper;
        this.articles = articles;
        this.objectMapper = objectMapper;
    }

    @GetMapping(value = "/ressources/{slug}", produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<String> resource(@PathVariable String slug, HttpServletRequest request) {
        return switch (slug) {
            case "articles" -> ResponseEntity.ok(buildResourceList(request, "ARTICLE", "Articles", "Articles de la bibliothèque LesCracks pour apprendre la tech en français."));
            case "ebooks" -> ResponseEntity.ok(buildResourceList(request, "EBOOK", "Ebooks", "Ebooks de la bibliothèque LesCracks pour apprendre la tech en français."));
            case "videos" -> ResponseEntity.ok(buildResourceList(request, "EXTERNAL_VIDEO", "Vidéos", "Vidéos de la bibliothèque LesCracks pour apprendre la tech en français."));
            default -> ResponseEntity.ok(buildResourceDetail(slug, request));
        };
    }

    @GetMapping(value = "/evenements/{slug}", produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<String> event(@PathVariable String slug, HttpServletRequest request) {
        Event event = events.requireBySlugOrId(slug);
        if (event.getStatus() != EventStatus.PUBLISHED) {
            throw new NotFoundException("Event", "slug", slug);
        }

        String canonical = canonical(request, "/evenements/" + (event.getSlug() != null ? event.getSlug() : event.getId()));
        SeoHtml html = new SeoHtml(event.getTitle() + " — LesCracks", event.getDescription(), canonical)
                .type("website")
                .image(absolute(request, event.getCoverImage()), event.getTitle(), null, null);

        html.breadcrumbs(List.of(
                new SeoHtml.Link(canonical(request, "/"), "Accueil"),
                new SeoHtml.Link(canonical(request, "/evenements"), "Événements"),
                new SeoHtml.Link(canonical, event.getTitle())
        ));

        html.fact("Type", formatEventType(event.getType()));
        html.fact("Format", formatEventFormat(event.getFormat()));
        if (event.getStartDate() != null) {
            html.fact("Début", ISO.format(event.getStartDate().atOffset(ZoneOffset.UTC)));
        }
        if (event.getEndDate() != null) {
            html.fact("Fin", ISO.format(event.getEndDate().atOffset(ZoneOffset.UTC)));
        }
        if (event.getLocation() != null && !event.getLocation().isBlank()) {
            html.fact("Lieu", event.getLocation());
        }
        html.paragraph(event.getDescription());

        Map<String, Object> location = buildEventLocation(event);
        Map<String, Object> jsonLd = new LinkedHashMap<>();
        jsonLd.put("@context", "https://schema.org");
        jsonLd.put("@type", "Event");
        jsonLd.put("name", event.getTitle());
        jsonLd.put("description", event.getDescription());
        jsonLd.put("url", canonical);
        jsonLd.put("image", absolute(request, event.getCoverImage()));
        jsonLd.put("startDate", ISO.format(event.getStartDate().atOffset(ZoneOffset.UTC)));
        if (event.getEndDate() != null) {
            jsonLd.put("endDate", ISO.format(event.getEndDate().atOffset(ZoneOffset.UTC)));
        }
        jsonLd.put("eventAttendanceMode", attendanceMode(event.getFormat()));
        jsonLd.put("eventStatus", eventStatus(event.getStatus()));
        if (location != null) {
            jsonLd.put("location", location);
        }
        jsonLd.put("organizer", Map.of("@type", "Organization", "name", "LesCracks", "url", baseUrl(request)));
        html.jsonLd(writeJson(jsonLd));

        html.jsonLd(writeJson(breadcrumbJsonLd(request, List.of(
                Map.of("name", "Accueil", "item", baseUrl(request) + "/"),
                Map.of("name", "Événements", "item", baseUrl(request) + "/evenements"),
                Map.of("name", event.getTitle(), "item", canonical)
        ))));

        return ResponseEntity.ok(html.render());
    }

    @GetMapping(value = "/pages/{page}", produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<String> page(@PathVariable String page, HttpServletRequest request) {
        PageMeta meta = pageMeta.get(page);
        if (meta == null) {
            throw new NotFoundException("Page", "page", page);
        }

        String canonical = canonical(request, meta.path());
        SeoHtml html = new SeoHtml(meta.title(), meta.description(), canonical)
                .image(absolute(request, PREVIEW_IMAGE), "LesCracks", PREVIEW_WIDTH, PREVIEW_HEIGHT);

        html.heading(meta.h1());
        html.paragraph(meta.description());

        List<SeoHtml.Link> nav = List.of(
                new SeoHtml.Link(canonical(request, "/"), "Accueil"),
                new SeoHtml.Link(canonical(request, "/ressources"), "Bibliothèque"),
                new SeoHtml.Link(canonical(request, "/evenements"), "Événements"),
                new SeoHtml.Link(canonical(request, "/a-propos"), "À propos")
        );
        html.navigation("Navigation principale", nav);

        if ("evenements".equals(page)) {
            addEventLinks(html, request);
        } else if ("ressources".equals(page)) {
            addResourceLinks(html, request);
        }

        if ("home".equals(page)) {
            html.jsonLd(writeJson(websiteJsonLd(request)));
        }
        html.jsonLd(writeJson(itemListJsonLd(request, nav)));
        html.jsonLd(writeJson(breadcrumbJsonLd(request, List.of(Map.of("name", meta.h1(), "item", canonical)))));

        return ResponseEntity.ok(html.render());
    }

    private String buildResourceDetail(String slug, HttpServletRequest request) {
        Resource resource = resources.requirePublishedBySlugOrId(slug);
        ResourceResponse response = mapper.toResponse(resource);
        String canonical = canonical(request, "/ressources/" + (response.slug() != null ? response.slug() : response.id()));
        SeoHtml html = new SeoHtml(response.title() + " — LesCracks", response.description(), canonical)
                .image(absolute(request, response.coverImage()), response.title(), null, null);

        html.breadcrumbs(List.of(
                new SeoHtml.Link(canonical(request, "/"), "Accueil"),
                new SeoHtml.Link(canonical(request, "/ressources"), "Bibliothèque"),
                new SeoHtml.Link(canonical, response.title())
        ));

        html.heading(response.title());
        html.paragraph(response.description());

        List<Map<String, Object>> breadcrumbItems = List.of(
                Map.of("name", "Accueil", "item", baseUrl(request) + "/"),
                Map.of("name", "Bibliothèque", "item", baseUrl(request) + "/ressources"),
                Map.of("name", response.title(), "item", canonical)
        );

        if ("ARTICLE".equals(response.kind())) {
            html.type("article");
            html.fact("Type", "Article");
            html.fact("Catégorie", response.categoryName());
            html.fact("Temps de lecture", response.readingMinutes() + " min");

            String prose = articles.findByResourceId(response.id())
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
            jsonLd.put("headline", response.title());
            jsonLd.put("description", response.description());
            jsonLd.put("image", absolute(request, response.coverImage()));
            jsonLd.put("url", canonical);
            jsonLd.put("datePublished", ISO.format(response.createdAt().atOffset(ZoneOffset.UTC)));
            jsonLd.put("dateModified", ISO.format(response.updatedAt().atOffset(ZoneOffset.UTC)));
            jsonLd.put("author", Map.of("@type", "Organization", "name", "LesCracks"));
            html.jsonLd(writeJson(jsonLd));
        } else if ("EBOOK".equals(response.kind())) {
            html.type("book");
            html.fact("Type", "Ebook");
            html.fact("Format", response.fileFormat());

            Map<String, Object> jsonLd = new LinkedHashMap<>();
            jsonLd.put("@context", "https://schema.org");
            jsonLd.put("@type", "LearningResource");
            jsonLd.put("name", response.title());
            jsonLd.put("description", response.description());
            jsonLd.put("image", absolute(request, response.coverImage()));
            jsonLd.put("url", canonical);
            jsonLd.put("learningResourceType", "Ebook");
            html.jsonLd(writeJson(jsonLd));
        } else if ("EXTERNAL_VIDEO".equals(response.kind())) {
            html.type("video.other");
            html.fact("Type", "Vidéo");
            html.fact("Plateforme", response.platform());

            Map<String, Object> jsonLd = new LinkedHashMap<>();
            jsonLd.put("@context", "https://schema.org");
            jsonLd.put("@type", "LearningResource");
            jsonLd.put("name", response.title());
            jsonLd.put("description", response.description());
            jsonLd.put("image", absolute(request, response.coverImage()));
            jsonLd.put("url", canonical);
            jsonLd.put("learningResourceType", "Video");
            html.jsonLd(writeJson(jsonLd));
        }

        html.jsonLd(writeJson(breadcrumbJsonLd(request, breadcrumbItems)));
        return html.render();
    }

    private String buildResourceList(HttpServletRequest request, String kind, String heading, String description) {
        String slug = kindToSlug(kind);
        String canonical = canonical(request, "/ressources/" + slug);

        SeoHtml html = new SeoHtml(heading + " — LesCracks", description, canonical)
                .image(absolute(request, PREVIEW_IMAGE), "LesCracks", PREVIEW_WIDTH, PREVIEW_HEIGHT);

        html.heading(heading);
        html.paragraph(description);

        var published = resources.search(ResourceStatus.PUBLISHED, null, kind, null, null, PageRequest.of(0, 100));

        List<SeoHtml.Link> links = new ArrayList<>();
        published.forEach(resource -> {
            ResourceResponse response = mapper.toResponse(resource);
            String resourceSlug = response.slug() != null ? response.slug() : String.valueOf(response.id());
            links.add(new SeoHtml.Link(canonical(request, "/ressources/" + resourceSlug), response.title()));
        });
        if (links.isEmpty()) {
            html.paragraph("Aucun contenu publié dans cette section pour le moment.");
        } else {
            html.links("Derniers contenus", links);
        }

        List<Map<String, Object>> items = new ArrayList<>();
        published.forEach(resource -> {
            ResourceResponse response = mapper.toResponse(resource);
            String resourceSlug = response.slug() != null ? response.slug() : String.valueOf(response.id());
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("@type", "ListItem");
            item.put("position", items.size() + 1);
            item.put("url", canonical(request, "/ressources/" + resourceSlug));
            item.put("name", response.title());
            items.add(item);
        });

        Map<String, Object> jsonLd = new LinkedHashMap<>();
        jsonLd.put("@context", "https://schema.org");
        jsonLd.put("@type", "CollectionPage");
        jsonLd.put("name", heading + " — LesCracks");
        jsonLd.put("url", canonical);
        jsonLd.put("mainEntity", Map.of("@type", "ItemList", "itemListElement", items));
        html.jsonLd(writeJson(jsonLd));

        html.jsonLd(writeJson(breadcrumbJsonLd(request, List.of(
                Map.of("name", "Accueil", "item", baseUrl(request) + "/"),
                Map.of("name", "Bibliothèque", "item", baseUrl(request) + "/ressources"),
                Map.of("name", heading, "item", canonical)
        ))));

        return html.render();
    }

    private void addEventLinks(SeoHtml html, HttpServletRequest request) {
        var published = events.published(null, null, PageRequest.of(0, 50));
        if (published.isEmpty()) {
            html.paragraph("Aucun événement publié pour le moment.");
            return;
        }

        List<SeoHtml.Link> links = new ArrayList<>();
        published.forEach(event -> links.add(new SeoHtml.Link(
                canonical(request, "/evenements/" + (event.getSlug() != null ? event.getSlug() : event.getId())), event.getTitle())));
        html.links("Prochains événements", links);
    }

    private void addResourceLinks(SeoHtml html, HttpServletRequest request) {
        var published = resources.search(ResourceStatus.PUBLISHED, null, null, null, null, PageRequest.of(0, 50));
        if (published.isEmpty()) {
            html.paragraph("Aucune ressource publiée pour le moment.");
            return;
        }

        List<SeoHtml.Link> links = new ArrayList<>();
        published.forEach(resource -> {
            ResourceResponse response = mapper.toResponse(resource);
            String slug = response.slug() != null ? response.slug() : String.valueOf(response.id());
            links.add(new SeoHtml.Link(canonical(request, "/ressources/" + slug), response.title()));
        });
        html.links("Ressources récentes", links);
    }

    private Map<String, Object> websiteJsonLd(HttpServletRequest request) {
        Map<String, Object> searchAction = new LinkedHashMap<>();
        searchAction.put("@type", "SearchAction");
        searchAction.put("target", Map.of("@type", "EntryPoint", "urlTemplate", baseUrl(request) + "/ressources?q={search_term_string}"));
        searchAction.put("query-input", "required name=search_term_string");

        Map<String, Object> website = new LinkedHashMap<>();
        website.put("@context", "https://schema.org");
        website.put("@type", "WebSite");
        website.put("name", "LesCracks");
        website.put("url", baseUrl(request));
        website.put("potentialAction", searchAction);
        return website;
    }

    private Map<String, Object> itemListJsonLd(HttpServletRequest request, List<SeoHtml.Link> links) {
        List<Map<String, Object>> items = new ArrayList<>();
        for (int i = 0; i < links.size(); i++) {
            SeoHtml.Link link = links.get(i);
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("@type", "ListItem");
            item.put("position", i + 1);
            item.put("name", link.label());
            item.put("item", absolute(request, link.href()));
            items.add(item);
        }

        Map<String, Object> list = new LinkedHashMap<>();
        list.put("@context", "https://schema.org");
        list.put("@type", "ItemList");
        list.put("itemListElement", items);
        return list;
    }

    private Map<String, Object> breadcrumbJsonLd(HttpServletRequest request, List<Map<String, Object>> crumbs) {
        List<Map<String, Object>> items = new ArrayList<>();
        for (int i = 0; i < crumbs.size(); i++) {
            Map<String, Object> crumb = crumbs.get(i);
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("@type", "ListItem");
            item.put("position", i + 1);
            item.put("name", crumb.get("name"));
            item.put("item", crumb.get("item"));
            items.add(item);
        }

        Map<String, Object> breadcrumb = new LinkedHashMap<>();
        breadcrumb.put("@context", "https://schema.org");
        breadcrumb.put("@type", "BreadcrumbList");
        breadcrumb.put("itemListElement", items);
        return breadcrumb;
    }

    private Map<String, Object> buildEventLocation(Event event) {
        String slug = event.getSlug() != null ? event.getSlug() : String.valueOf(event.getId());
        if (event.getFormat() == EventFormat.ONLINE) {
            return Map.of("@type", "VirtualLocation", "url", event.getLocation() != null ? event.getLocation() : "https://lescracks.com/evenements/" + slug);
        }
        if (event.getLocation() != null && !event.getLocation().isBlank()) {
            return Map.of("@type", "Place", "name", event.getLocation());
        }
        return null;
    }

    private String attendanceMode(EventFormat format) {
        return switch (format) {
            case ONLINE -> "https://schema.org/OnlineEventAttendanceMode";
            case HYBRID -> "https://schema.org/MixedEventAttendanceMode";
            default -> "https://schema.org/OfflineEventAttendanceMode";
        };
    }

    private String eventStatus(EventStatus status) {
        return status == EventStatus.CANCELLED
                ? "https://schema.org/EventCancelled"
                : "https://schema.org/EventScheduled";
    }

    private String kindToSlug(String kind) {
        return switch (kind) {
            case "EBOOK" -> "ebooks";
            case "EXTERNAL_VIDEO" -> "videos";
            case "ARTICLE" -> "articles";
            default -> kind.toLowerCase();
        };
    }

    private String formatEventType(com.brandonkamga.lescracks.domain.EventType type) {
        return switch (type) {
            case BOOTCAMP -> "Bootcamp";
            case WORKSHOP -> "Atelier";
            case WEBINAR -> "Webinaire";
            case CONFERENCE -> "Conférence";
        };
    }

    private String formatEventFormat(EventFormat format) {
        return switch (format) {
            case ONLINE -> "En ligne";
            case OFFLINE -> "Sur place";
            case HYBRID -> "Hybride";
        };
    }

    private String canonical(HttpServletRequest request, String path) {
        return baseUrl(request) + path;
    }

    private String baseUrl(HttpServletRequest request) {
        String scheme = request.getScheme();
        String host = request.getServerName();
        int port = request.getServerPort();
        if (("http".equals(scheme) && port == 80) || ("https".equals(scheme) && port == 443)) {
            return scheme + "://" + host;
        }
        return scheme + "://" + host + ":" + port;
    }

    private String absolute(HttpServletRequest request, String pathOrUrl) {
        if (pathOrUrl == null || pathOrUrl.isBlank()) {
            return baseUrl(request) + PREVIEW_IMAGE;
        }
        if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) {
            return pathOrUrl;
        }
        if (pathOrUrl.startsWith("/")) {
            return baseUrl(request) + pathOrUrl;
        }
        return baseUrl(request) + "/" + pathOrUrl;
    }

    private String writeJson(Map<String, Object> value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (Exception e) {
            throw new IllegalStateException("Cannot render JSON-LD", e);
        }
    }

    private record PageMeta(String title, String description, String path, String h1) {
    }
}
