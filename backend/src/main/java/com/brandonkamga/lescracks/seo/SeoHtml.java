package com.brandonkamga.lescracks.seo;

import java.util.ArrayList;
import java.util.List;

/**
 * Assembles the HTML a crawler receives instead of the SPA.
 *
 * Deliberately free of any template engine: a snapshot is a head, a heading and some
 * prose, and a dependency that renders that would cost more than it saves. Nothing here
 * touches Spring, so the output can be asserted in a plain unit test.
 */
public final class SeoHtml {

    private final String title;
    private final String description;
    private final String canonical;
    private final List<String> meta = new ArrayList<>();
    private final List<String> body = new ArrayList<>();
    private String jsonLd;

    public SeoHtml(String title, String description, String canonical) {
        this.title = title;
        this.description = description;
        this.canonical = canonical;
    }

    /** Escapes into element text and double-quoted attributes alike. */
    public static String escape(String raw) {
        if (raw == null) {
            return "";
        }
        return raw.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }

    /**
     * A JSON string literal. Backslash first, or it would escape the escapes it just added.
     * Control characters below 0x20 are illegal raw in JSON and appear in pasted prose.
     */
    public static String json(String raw) {
        if (raw == null) {
            return "\"\"";
        }
        StringBuilder out = new StringBuilder("\"");
        for (char c : raw.toCharArray()) {
            switch (c) {
                case '\\' -> out.append("\\\\");
                case '"' -> out.append("\\\"");
                case '\n' -> out.append("\\n");
                case '\r' -> out.append("\\r");
                case '\t' -> out.append("\\t");
                // </script> inside a JSON-LD block would close the block early.
                case '<' -> out.append("\\u003c");
                default -> out.append(c < 0x20 ? String.format("\\u%04x", (int) c) : c);
            }
        }
        return out.append('"').toString();
    }

    public SeoHtml image(String url) {
        return url == null ? this : metaProperty("og:image", url);
    }

    public SeoHtml metaProperty(String property, String content) {
        meta.add("<meta property=\"" + escape(property) + "\" content=\"" + escape(content) + "\">");
        return this;
    }

    public SeoHtml jsonLd(String rawJson) {
        this.jsonLd = rawJson;
        return this;
    }

    public SeoHtml heading(String text) {
        body.add("<h1>" + escape(text) + "</h1>");
        return this;
    }

    public SeoHtml paragraph(String text) {
        if (text != null && !text.isBlank()) {
            body.add("<p>" + escape(text) + "</p>");
        }
        return this;
    }

    /** A definition pair, for the facts a crawler reads as structure rather than prose. */
    public SeoHtml fact(String label, String value) {
        if (value != null && !value.isBlank()) {
            body.add("<p><strong>" + escape(label) + "</strong> " + escape(value) + "</p>");
        }
        return this;
    }

    public SeoHtml links(String heading, List<Link> items) {
        body.add("<h2>" + escape(heading) + "</h2><ul>");
        items.forEach(l -> body.add("<li><a href=\"" + escape(l.href()) + "\">" + escape(l.label()) + "</a></li>"));
        body.add("</ul>");
        return this;
    }

    public String render() {
        StringBuilder out = new StringBuilder("<!doctype html><html lang=\"fr\"><head>");
        out.append("<meta charset=\"utf-8\">");
        out.append("<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">");
        out.append("<title>").append(escape(title)).append("</title>");
        out.append("<meta name=\"description\" content=\"").append(escape(description)).append("\">");
        out.append("<link rel=\"canonical\" href=\"").append(escape(canonical)).append("\">");
        out.append("<meta property=\"og:title\" content=\"").append(escape(title)).append("\">");
        out.append("<meta property=\"og:description\" content=\"").append(escape(description)).append("\">");
        out.append("<meta property=\"og:url\" content=\"").append(escape(canonical)).append("\">");
        meta.forEach(out::append);
        if (jsonLd != null) {
            out.append("<script type=\"application/ld+json\">").append(jsonLd).append("</script>");
        }
        out.append("</head><body>");
        body.forEach(out::append);
        out.append("</body></html>");
        return out.toString();
    }

    public record Link(String href, String label) {
    }
}
