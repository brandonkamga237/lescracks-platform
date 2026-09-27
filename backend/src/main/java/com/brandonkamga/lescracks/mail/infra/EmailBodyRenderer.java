package com.brandonkamga.lescracks.mail.infra;

import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.stereotype.Component;

import java.util.function.UnaryOperator;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Turns a block document into the HTML fragment that goes inside the fixed newsletter frame.
 *
 * The frame (header, contacts, motto) is {@code MailServiceImpl}'s job and never changes;
 * this is only the part an admin personalises. Everything is escaped: an admin writes text,
 * never HTML, so nothing typed into the editor can alter the email markup.
 */
@Component
public class EmailBodyRenderer {

    private static final Pattern INLINE = Pattern.compile(
            "\\*\\*[^*]+\\*\\*|\\*[^*]+\\*|`[^`]+`|\\[[^\\]]+\\]\\([^)\\s]+\\)");

    /** Renders the admin's blocks; {@code personalize} rewrites {{variables}} inside prose. */
    public String render(JsonNode body, UnaryOperator<String> personalize) {
        StringBuilder html = new StringBuilder();
        if (body == null || !body.isArray()) {
            return html.toString();
        }
        for (JsonNode block : body) {
            html.append(block(block, personalize));
        }
        return html.toString();
    }

    private String block(JsonNode block, UnaryOperator<String> p) {
        String type = block.path("type").asText("");
        return switch (type) {
            case "paragraph" -> prose(block, p, personal ->
                    "<p style=\"margin:0 0 20px 0;font-size:16px;line-height:1.7;color:#d4d4d4;\">" + personal + "</p>");
            case "heading" -> {
                int level = block.path("level").asInt(2) == 3 ? 3 : 2;
                String style = level == 2
                        ? "margin:32px 0 16px 0;font-size:22px;font-weight:700;color:#ffffff;"
                        : "margin:24px 0 12px 0;font-size:18px;font-weight:600;color:#ffffff;";
                yield prose(block, p, personal ->
                        "<h" + level + " style=\"" + style + "\">" + personal + "</h" + level + ">");
            }
            case "quote" -> prose(block, p, personal ->
                    "<blockquote style=\"margin:0 0 20px 0;padding:4px 0 4px 20px;border-left:3px solid #d4af37;"
                            + "font-size:17px;font-style:italic;line-height:1.7;color:#e5e5e5;\">" + personal + "</blockquote>");
            case "list" -> {
                StringBuilder items = new StringBuilder();
                for (JsonNode item : block.path("items")) {
                    String t = item.path("text").asText("");
                    if (!t.isBlank()) {
                        items.append("<li style=\"margin:0 0 8px 0;font-size:16px;line-height:1.6;color:#d4d4d4;\">")
                                .append(inline(p.apply(t))).append("</li>");
                    }
                }
                yield items.isEmpty() ? "" : "<ul style=\"margin:0 0 20px 0;padding-left:22px;\">" + items + "</ul>";
            }
            case "image" -> {
                String url = safeUrl(block.path("url").asText(""));
                if (url == null) {
                    yield "";
                }
                String img = "<img src=\"" + url + "\" alt=\"" + escape(p.apply(block.path("alt").asText("")))
                        + "\" style=\"display:block;width:100%;border-radius:12px;margin:0 0 8px 0;\" />";
                String caption = block.path("caption").asText("");
                yield caption.isBlank() ? img
                        : img + "<p style=\"margin:0 0 20px 0;font-size:13px;text-align:center;color:#737373;\">"
                        + escape(p.apply(caption)) + "</p>";
            }
            case "link" -> {
                String url = safeUrl(block.path("url").asText(""));
                if (url == null) {
                    yield "";
                }
                String label = block.path("text").asText("");
                yield "<p style=\"margin:0 0 20px 0;\"><a href=\"" + url
                        + "\" style=\"color:#d4af37;font-size:16px;font-weight:600;text-decoration:underline;text-underline-offset:3px;\">"
                        + (label.isBlank() ? url : escape(p.apply(label))) + "</a></p>";
            }
            case "divider" -> "<hr style=\"border:none;border-top:1px solid #2a2a2a;margin:28px 0;\" />";
            default -> "";
        };
    }

    private interface Wrapper { String wrap(String inner); }

    private String prose(JsonNode block, UnaryOperator<String> personalize, Wrapper wrapper) {
        String text = personalize.apply(block.path("text").asText(""));
        return text.isBlank() ? "" : wrapper.wrap(inline(escape(text)));
    }

    /** Converts **bold**, *italic*, `code` and [label](url) marks on already-escaped text. */
    private String inline(String escaped) {
        Matcher matcher = INLINE.matcher(escaped);
        StringBuilder out = new StringBuilder();
        while (matcher.find()) {
            String token = matcher.group();
            String html;
            if (token.startsWith("**")) {
                html = "<strong style=\"color:#ffffff;\">" + token.substring(2, token.length() - 2) + "</strong>";
            } else if (token.startsWith("*")) {
                html = "<em>" + token.substring(1, token.length() - 1) + "</em>";
            } else if (token.startsWith("`")) {
                html = "<code style=\"background:#262626;padding:2px 6px;border-radius:6px;font-size:14px;color:#f5d97e;\">"
                        + token.substring(1, token.length() - 1) + "</code>";
            } else {
                int close = token.indexOf(']');
                String label = token.substring(1, close);
                String url = safeUrl(unescape(token.substring(close + 2, token.length() - 1)));
                html = url == null ? label
                        : "<a href=\"" + url + "\" style=\"color:#d4af37;text-decoration:underline;text-underline-offset:3px;\">" + label + "</a>";
            }
            matcher.appendReplacement(out, Matcher.quoteReplacement(html));
        }
        matcher.appendTail(out);
        return out.toString();
    }

    /** A link is rendered only when it points at http(s) — anything else would break the frame. */
    private String safeUrl(String url) {
        return url != null && (url.startsWith("https://") || url.startsWith("http://")) ? url : null;
    }

    private String escape(String value) {
        return value.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\"", "&quot;");
    }

    /** Undoes the minimal escapes inside a link target so the real URL reaches the href. */
    private String unescape(String value) {
        return value.replace("&quot;", "\"").replace("&amp;", "&");
    }
}
