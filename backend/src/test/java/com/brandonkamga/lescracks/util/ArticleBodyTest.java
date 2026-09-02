package com.brandonkamga.lescracks.util;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class ArticleBodyTest {

    private final ArticleBody body = new ArticleBody(new ObjectMapper());

    private static final String ARTICLE = """
            {"type":"doc","content":[
              {"type":"heading","level":1,"text":"Déployer sur un VPS"},
              {"type":"paragraph","text":"Un serveur nu et beaucoup de patience."},
              {"type":"image","mediaId":12,"caption":"Le tableau de bord","alt":"Capture"},
              {"type":"list","content":[
                 {"type":"item","text":"Installer Docker"},
                 {"type":"item","text":"Configurer Traefik"}]},
              {"type":"image","mediaId":7,"caption":""},
              {"type":"image","mediaId":12}
            ]}
            """;

    @Test
    @DisplayName("prose is flattened in reading order, once each")
    void collectsProseInOrder() {
        String text = body.toPlainText(ARTICLE);

        assertThat(text).isEqualTo("Déployer sur un VPS Un serveur nu et beaucoup de patience. "
                + "Le tableau de bord Capture Installer Docker Configurer Traefik");
    }

    @Test
    @DisplayName("nested blocks are not counted twice")
    void doesNotDoubleCountNestedText() {
        String text = body.toPlainText(ARTICLE);

        assertThat(text.split("Installer Docker", -1)).hasSize(2);
    }

    @Test
    @DisplayName("only named prose fields are read, never types or levels")
    void ignoresStructuralFields() {
        assertThat(body.toPlainText(ARTICLE))
                .doesNotContain("doc", "heading", "paragraph", "image", "item");
    }

    @Test
    @DisplayName("each image is reported once, in the order it appears")
    void collectsMediaIdsWithoutDuplicates() {
        assertThat(body.mediaIds(ARTICLE)).containsExactly(12L, 7L);
    }

    @Test
    @DisplayName("a document with no image reports none")
    void noImagesMeansEmpty() {
        assertThat(body.mediaIds("{\"type\":\"doc\",\"content\":[{\"type\":\"paragraph\",\"text\":\"x\"}]}"))
                .isEmpty();
    }

    @Test
    @DisplayName("reading time rounds up and is never zero")
    void readingTimeIsAtLeastOneMinute() {
        assertThat(body.readingMinutes("")).isEqualTo(1);
        assertThat(body.readingMinutes("un mot")).isEqualTo(1);
        assertThat(body.readingMinutes("mot ".repeat(200).trim())).isEqualTo(1);
        assertThat(body.readingMinutes("mot ".repeat(201).trim())).isEqualTo(2);
        assertThat(body.readingMinutes("mot ".repeat(1000).trim())).isEqualTo(5);
    }

    @Test
    @DisplayName("a malformed body is refused with a message an admin can read")
    void refusesMalformedJson() {
        assertThatThrownBy(() -> body.toPlainText("{ nope"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("valid JSON");
    }
}
