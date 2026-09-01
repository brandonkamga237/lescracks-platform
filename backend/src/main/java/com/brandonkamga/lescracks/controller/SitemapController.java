package com.brandonkamga.lescracks.controller;

import com.brandonkamga.lescracks.repository.EventRepository;
import com.brandonkamga.lescracks.repository.ResourceRepository;
import com.brandonkamga.lescracks.seo.SeoHtml;
import io.swagger.v3.oas.annotations.Hidden;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Reads two slug columns and joins them into XML. No service sits in front because there
 * is no rule to enforce here: what is published is in the sitemap, and that is the whole
 * of it.
 */
@RestController
@Hidden
public class SitemapController {

    private static final List<String> STATIC_PATHS = List.of("/", "/about", "/programme", "/postuler");

    private final EventRepository events;
    private final ResourceRepository resources;
    private final String site;

    public SitemapController(EventRepository events, ResourceRepository resources,
                             @Value("${app.site.url:http://localhost:5173}") String site) {
        this.events = events;
        this.resources = resources;
        this.site = site;
    }

    @GetMapping(value = "/api/sitemap.xml", produces = MediaType.APPLICATION_XML_VALUE)
    @Transactional(readOnly = true)
    public String sitemap() {
        StringBuilder xml = new StringBuilder("<?xml version=\"1.0\" encoding=\"UTF-8\"?>")
                .append("<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">");

        STATIC_PATHS.forEach(path -> append(xml, path, "1.0"));
        events.findPublishedSlugs().forEach(slug -> append(xml, "/evenements/" + slug, "0.8"));
        resources.findPublishedSlugs().forEach(slug -> append(xml, "/ressources/" + slug, "0.6"));

        return xml.append("</urlset>").toString();
    }

    private void append(StringBuilder xml, String path, String priority) {
        xml.append("<url><loc>").append(SeoHtml.escape(site + path)).append("</loc>")
                .append("<priority>").append(priority).append("</priority></url>");
    }
}
