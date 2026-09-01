package com.brandonkamga.lescracks.util;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.LinkedHashSet;
import java.util.Set;

/**
 * Reads a block document.
 *
 * An article is stored as typed blocks, which is right for editing and useless for two things
 * the platform needs constantly: prose to search and index, and the list of images a piece
 * actually uses. Both are derived here, once, when the article is saved.
 */
public final class ArticleBody {

    /** Roughly what an adult reads in a minute of technical prose. */
    private static final int WORDS_PER_MINUTE = 200;

    private final ObjectMapper mapper;

    public ArticleBody(ObjectMapper mapper) {
        this.mapper = mapper;
    }

    /** Every piece of text in the document, flattened, for search and for the SEO snapshot. */
    public String toPlainText(String bodyJson) {
        StringBuilder out = new StringBuilder();
        collectText(read(bodyJson), out);
        return out.toString().strip();
    }

    /** The ids of the images the document shows, so the resource can record what it uses. */
    public Set<Long> mediaIds(String bodyJson) {
        Set<Long> ids = new LinkedHashSet<>();
        collectMediaIds(read(bodyJson), ids);
        return ids;
    }

    /** An estimate the reader sees before committing. Always at least a minute. */
    public int readingMinutes(String plainText) {
        int words = plainText.isBlank() ? 0 : plainText.trim().split("\\s+").length;
        return Math.max(1, (int) Math.ceil((double) words / WORDS_PER_MINUTE));
    }

    private JsonNode read(String json) {
        try {
            return mapper.readTree(json);
        } catch (Exception malformed) {
            throw new IllegalArgumentException("The article body is not valid JSON", malformed);
        }
    }

    /** Fields that hold prose a reader sees. An id, a url or a language tag is not one. */
    private static final Set<String> PROSE_FIELDS = Set.of("text", "caption", "alt");

    private void collectText(JsonNode node, StringBuilder out) {
        if (node.isArray()) {
            node.forEach(child -> collectText(child, out));
            return;
        }
        if (!node.isObject()) {
            return;
        }
        node.fields().forEachRemaining(field -> {
            JsonNode value = field.getValue();
            if (value.isTextual()) {
                // Only named prose is collected, so recursing never picks the same string twice.
                if (PROSE_FIELDS.contains(field.getKey())) {
                    append(out, value.asText());
                }
            } else {
                collectText(value, out);
            }
        });
    }

    private void append(StringBuilder out, String text) {
        if (text.isBlank()) {
            return;
        }
        if (!out.isEmpty()) {
            out.append(' ');
        }
        out.append(text.strip());
    }

    private void collectMediaIds(JsonNode node, Set<Long> ids) {
        if (node.isObject()) {
            JsonNode mediaId = node.get("mediaId");
            if (mediaId != null && mediaId.canConvertToLong()) {
                ids.add(mediaId.asLong());
            }
            node.forEach(child -> collectMediaIds(child, ids));
        } else if (node.isArray()) {
            node.forEach(child -> collectMediaIds(child, ids));
        }
    }
}
