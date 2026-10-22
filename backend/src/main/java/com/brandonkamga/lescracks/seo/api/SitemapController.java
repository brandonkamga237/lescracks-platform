package com.brandonkamga.lescracks.seo.api;

import com.brandonkamga.lescracks.event.application.EventCatalog;
import com.brandonkamga.lescracks.content.application.ArticleCatalog;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;

@RestController
@RequestMapping("/api/sitemap.xml")
public class SitemapController {

    private final ArticleCatalog articles;
    private final EventCatalog events;
    private static final DateTimeFormatter W3C = DateTimeFormatter.ISO_OFFSET_DATE_TIME;

    public SitemapController(ArticleCatalog articles, EventCatalog events) {
        this.articles = articles;
        this.events = events;
    }

    @GetMapping(produces = MediaType.APPLICATION_XML_VALUE)
    public ResponseEntity<String> sitemap(HttpServletRequest request) {
        String base = baseUrl(request);
        StringBuilder xml = new StringBuilder();
        xml.append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n");
        xml.append("<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">\n");

        addUrl(xml, base, "/", "1.0", "daily");
        addUrl(xml, base, "/blog", "0.8", "daily");
        addUrl(xml, base, "/formations", "0.6", "monthly");
        addUrl(xml, base, "/evenements", "0.6", "daily");
        addUrl(xml, base, "/talk", "0.6", "weekly");
        addUrl(xml, base, "/a-propos", "0.5", "monthly");
        addUrl(xml, base, "/conditions-utilisation", "0.3", "yearly");
        addUrl(xml, base, "/politique-confidentialite", "0.3", "yearly");

        articles.listPublished().forEach(article -> {
            String lastmod = W3C.format(article.getUpdatedAt().atOffset(ZoneOffset.UTC));
            xml.append("  <url>\n");
            xml.append("    <loc>").append(escape(base + article.path())).append("</loc>\n");
            xml.append("    <lastmod>").append(escape(lastmod)).append("</lastmod>\n");
            xml.append("    <priority>0.7</priority>\n");
            xml.append("    <changefreq>weekly</changefreq>\n");
            xml.append("  </url>\n");
        });

        events.listPublished().forEach(event -> {
            String lastmod = W3C.format(event.getUpdatedAt().atOffset(ZoneOffset.UTC));
            xml.append("  <url>\n");
            xml.append("    <loc>").append(escape(base + event.path())).append("</loc>\n");
            xml.append("    <lastmod>").append(escape(lastmod)).append("</lastmod>\n");
            xml.append("    <priority>0.7</priority>\n");
            xml.append("    <changefreq>weekly</changefreq>\n");
            xml.append("  </url>\n");
        });

        xml.append("</urlset>");
        return ResponseEntity.ok(xml.toString());
    }

    private void addUrl(StringBuilder xml, String base, String path, String priority, String changefreq) {
        xml.append("  <url>\n");
        xml.append("    <loc>").append(escape(base + path)).append("</loc>\n");
        xml.append("    <priority>").append(escape(priority)).append("</priority>\n");
        xml.append("    <changefreq>").append(escape(changefreq)).append("</changefreq>\n");
        xml.append("  </url>\n");
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

    private String escape(String raw) {
        return raw.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }
}
