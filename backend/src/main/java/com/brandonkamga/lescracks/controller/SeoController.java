package com.brandonkamga.lescracks.controller;

import com.brandonkamga.lescracks.domain.Event;
import com.brandonkamga.lescracks.domain.Resource;
import com.brandonkamga.lescracks.domain.ResourceArticle;
import com.brandonkamga.lescracks.exception.NotFoundException;
import com.brandonkamga.lescracks.seo.SeoHtml;
import com.brandonkamga.lescracks.service.interfaces.EventService;
import com.brandonkamga.lescracks.service.interfaces.MediaService;
import com.brandonkamga.lescracks.service.interfaces.ResourceService;
import io.swagger.v3.oas.annotations.Hidden;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.format.DateTimeFormatter;
import java.util.Map;

/**
 * The HTML crawlers get instead of the SPA, which they cannot run.
 *
 * Outside /api on purpose: nginx routes bot user-agents here, so these paths are an
 * internal contract with the proxy rather than part of the public API.
 */
@RestController
@RequestMapping(value = "/seo", produces = MediaType.TEXT_HTML_VALUE)
@Hidden
public class SeoController {

    private static final DateTimeFormatter ISO = DateTimeFormatter.ISO_INSTANT;

    /** Marketing copy lives here rather than in a template: four pages, one line each. */
    private static final Map<String, String[]> PAGES = Map.of(
            "home", new String[]{
                    "LesCracks — Formations tech et Accompagnement 360",
                    "Bootcamps, ateliers, ressources et Accompagnement 360 pour progresser en développement.",
                    "Apprendre la tech, sérieusement"},
            "about", new String[]{
                    "À propos — LesCracks",
                    "Qui nous sommes et pourquoi nous formons des développeurs.",
                    "À propos de LesCracks"},
            "programme", new String[]{
                    "Accompagnement 360 — LesCracks",
                    "Un accompagnement individuel pour passer du code qui marche au code qui tient.",
                    "L'Accompagnement 360"},
            "postuler", new String[]{
                    "Postuler — LesCracks",
                    "Déposez votre candidature à l'Accompagnement 360.",
                    "Postuler à l'Accompagnement 360"});

    private final EventService events;
    private final ResourceService resources;
    private final MediaService media;
    private final String site;

    public SeoController(EventService events, ResourceService resources, MediaService media,
                         @Value("${app.site.url:http://localhost:5173}") String site) {
        this.events = events;
        this.resources = resources;
        this.media = media;
        this.site = site;
    }

    @GetMapping("/pages/{page}")
    public String page(@PathVariable String page) {
        String[] copy = PAGES.get(page);
        if (copy == null) {
            throw new NotFoundException("SeoPage", "name", page);
        }
        String path = "home".equals(page) ? "/" : "/" + page;
        return new SeoHtml(copy[0], copy[1], site + path)
                .jsonLd(organisationJsonLd())
                .heading(copy[2])
                .paragraph(copy[1])
                .render();
    }

    @GetMapping("/evenements/{slug}")
    public String event(@PathVariable String slug) {
        Event event = events.requireBySlug(slug);
        String url = site + "/evenements/" + event.getSlug();

        return new SeoHtml(event.getTitle() + " — LesCracks", event.getSummary(), url)
                .metaProperty("og:type", "event")
                .image(event.getCover() == null ? null : media.urlFor(event.getCover()))
                .jsonLd(eventJsonLd(event, url))
                .heading(event.getTitle())
                .paragraph(event.getSummary())
                .fact("Début :", ISO.format(event.getStartsAt()))
                .fact("Lieu :", event.getLocation())
                .paragraph(event.getDescription())
                .render();
    }

    @GetMapping("/ressources/{slug}")
    public String resource(@PathVariable String slug) {
        Resource resource = resources.requireBySlug(slug);
        String url = site + "/ressources/" + resource.getSlug();

        SeoHtml html = new SeoHtml(resource.getTitle() + " — LesCracks", resource.getSummary(), url)
                .metaProperty("og:type", "article")
                .image(resource.getCover() == null ? null : media.urlFor(resource.getCover()))
                .jsonLd(resourceJsonLd(resource, url))
                .heading(resource.getTitle())
                .paragraph(resource.getSummary());

        // Only an article has prose to give a crawler; a video is a link and an ebook a file.
        if (resource instanceof ResourceArticle article) {
            html.paragraph(article.getBodyText());
        }
        return html.render();
    }

    private String organisationJsonLd() {
        return "{\"@context\":\"https://schema.org\",\"@type\":\"Organization\","
                + "\"name\":\"LesCracks\",\"url\":" + SeoHtml.json(site) + "}";
    }

    private String eventJsonLd(Event event, String url) {
        StringBuilder json = new StringBuilder("{\"@context\":\"https://schema.org\",\"@type\":\"Event\"")
                .append(",\"name\":").append(SeoHtml.json(event.getTitle()))
                .append(",\"description\":").append(SeoHtml.json(event.getSummary()))
                .append(",\"url\":").append(SeoHtml.json(url))
                .append(",\"startDate\":").append(SeoHtml.json(ISO.format(event.getStartsAt())));
        if (event.getEndsAt() != null) {
            json.append(",\"endDate\":").append(SeoHtml.json(ISO.format(event.getEndsAt())));
        }
        if (event.getLocation() != null) {
            json.append(",\"location\":{\"@type\":\"Place\",\"name\":")
                    .append(SeoHtml.json(event.getLocation())).append("}");
        }
        return json.append(",\"organizer\":{\"@type\":\"Organization\",\"name\":\"LesCracks\"}}").toString();
    }

    private String resourceJsonLd(Resource resource, String url) {
        return "{\"@context\":\"https://schema.org\",\"@type\":\"Article\""
                + ",\"headline\":" + SeoHtml.json(resource.getTitle())
                + ",\"description\":" + SeoHtml.json(resource.getSummary())
                + ",\"url\":" + SeoHtml.json(url)
                + ",\"datePublished\":" + SeoHtml.json(ISO.format(resource.getCreatedAt()))
                + ",\"publisher\":{\"@type\":\"Organization\",\"name\":\"LesCracks\"}}";
    }
}
