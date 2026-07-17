package com.brandonkamga.lescracks.controller;

import com.brandonkamga.lescracks.domain.Event;
import com.brandonkamga.lescracks.domain.Learner;
import com.brandonkamga.lescracks.domain.Resource;
import com.brandonkamga.lescracks.repository.EventRepository;
import com.brandonkamga.lescracks.repository.LearnerRepository;
import com.brandonkamga.lescracks.repository.ResourceRepository;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Serves the sitemap, built live from the DB, so every published event, resource and
 * showcased learner is discoverable the moment it exists. A static file would only ever
 * list the fixed routes and go stale on each new content item — which is exactly why
 * new slug pages were never getting indexed.
 *
 * Exposed to crawlers at the site root (https://lescracks.com/sitemap.xml) via an nginx
 * exact-match proxy to this /api endpoint.
 */
@RestController
public class SitemapController {

    private static final String BASE = "https://lescracks.com";

    private final EventRepository eventRepository;
    private final ResourceRepository resourceRepository;
    private final LearnerRepository learnerRepository;

    public SitemapController(EventRepository eventRepository,
                             ResourceRepository resourceRepository,
                             LearnerRepository learnerRepository) {
        this.eventRepository = eventRepository;
        this.resourceRepository = resourceRepository;
        this.learnerRepository = learnerRepository;
    }

    @GetMapping(value = "/api/sitemap.xml", produces = MediaType.APPLICATION_XML_VALUE)
    public String sitemap() {
        String today = LocalDate.now().toString();
        StringBuilder xml = new StringBuilder(4096);
        xml.append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n");
        xml.append("<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">\n");

        // Fixed, high-value routes.
        url(xml, "/", today, "weekly", "1.0");
        url(xml, "/postuler", today, "monthly", "0.95");
        url(xml, "/ressources", today, "weekly", "0.9");
        url(xml, "/evenements", today, "weekly", "0.85");
        url(xml, "/apprenants", today, "weekly", "0.8");
        url(xml, "/open-source", today, "monthly", "0.75");
        url(xml, "/about", today, "monthly", "0.7");

        // Dynamic content, resolved by slug.
        for (Event e : eventRepository.findAll()) {
            if (e.getSlug() != null) {
                url(xml, "/evenements/" + e.getSlug(), lastmod(e.getCreatedAt(), today), "weekly", "0.7");
            }
        }
        for (Resource r : resourceRepository.findAll()) {
            if (r.getSlug() != null) {
                url(xml, "/ressources/" + r.getSlug(), lastmod(r.getCreatedAt(), today), "monthly", "0.7");
            }
        }
        for (Learner l : learnerRepository.findByVisibleTrueOrderByDisplayOrderAsc()) {
            if (l.getSlug() != null) {
                url(xml, "/apprenants/" + l.getSlug(), lastmod(l.getCreatedAt(), today), "monthly", "0.6");
            }
        }

        xml.append("</urlset>\n");
        return xml.toString();
    }

    private static String lastmod(LocalDateTime createdAt, String fallback) {
        return createdAt != null ? createdAt.toLocalDate().toString() : fallback;
    }

    private static void url(StringBuilder xml, String path, String lastmod, String changefreq, String priority) {
        xml.append("  <url>\n")
           .append("    <loc>").append(BASE).append(path).append("</loc>\n")
           .append("    <lastmod>").append(lastmod).append("</lastmod>\n")
           .append("    <changefreq>").append(changefreq).append("</changefreq>\n")
           .append("    <priority>").append(priority).append("</priority>\n")
           .append("  </url>\n");
    }
}
