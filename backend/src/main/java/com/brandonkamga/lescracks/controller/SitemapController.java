package com.brandonkamga.lescracks.controller;

import com.brandonkamga.lescracks.domain.ResourceStatus;
import com.brandonkamga.lescracks.service.interfaces.ResourceService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.data.domain.PageRequest;
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

    private final ResourceService resources;
    private static final DateTimeFormatter W3C = DateTimeFormatter.ISO_OFFSET_DATE_TIME;

    public SitemapController(ResourceService resources) {
        this.resources = resources;
    }

    @GetMapping(produces = MediaType.APPLICATION_XML_VALUE)
    public ResponseEntity<String> sitemap(HttpServletRequest request) {
        String base = baseUrl(request);
        StringBuilder xml = new StringBuilder();
        xml.append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n");
        xml.append("<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">\n");

        addUrl(xml, base, "/", "1.0");
        addUrl(xml, base, "/ressources", "0.8");
        addUrl(xml, base, "/ressources/ebooks", "0.8");
        addUrl(xml, base, "/ressources/videos", "0.8");
        addUrl(xml, base, "/ressources/articles", "0.8");
        addUrl(xml, base, "/evenements", "0.6");
        addUrl(xml, base, "/a-propos", "0.5");

        var published = resources.search(ResourceStatus.PUBLISHED, null, null, null, null, PageRequest.of(0, 10_000));
        published.forEach(resource -> {
            String lastmod = W3C.format(resource.getUpdatedAt().atOffset(ZoneOffset.UTC));
            xml.append("  <url>\n");
            xml.append("    <loc>").append(escape(base + "/ressources/" + resource.getId())).append("</loc>\n");
            xml.append("    <lastmod>").append(escape(lastmod)).append("</lastmod>\n");
            xml.append("    <priority>0.7</priority>\n");
            xml.append("  </url>\n");
        });

        xml.append("</urlset>");
        return ResponseEntity.ok(xml.toString());
    }

    private void addUrl(StringBuilder xml, String base, String path, String priority) {
        xml.append("  <url>\n");
        xml.append("    <loc>").append(escape(base + path)).append("</loc>\n");
        xml.append("    <priority>").append(escape(priority)).append("</priority>\n");
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
