package com.brandonkamga.lescracks.resource.domain;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class ArticleBodyTest {

    private final ArticleBody articleBody = new ArticleBody(new ObjectMapper());

    @Test
    @DisplayName("a legacy html body is flattened to its text")
    void readsTheHtmlForm() {
        String plainText = articleBody.toPlainText("""
                {"html": "<h2>Titre</h2><p>Bonjour <b>le</b> monde</p>"}
                """);

        assertThat(plainText).isEqualTo("Titre Bonjour le monde");
    }

    @Test
    @DisplayName("only named prose is collected: a url or a block type is not content")
    void readsTheBlockForm() {
        String plainText = articleBody.toPlainText("""
                {"blocks": [
                  {"type": "paragraph", "text": "Premier paragraphe"},
                  {"type": "image", "mediaId": 42, "url": "https://cdn/x.png", "caption": "Une légende"},
                  {"type": "paragraph", "text": "  Second  "}
                ]}
                """);

        assertThat(plainText).isEqualTo("Premier paragraphe Une légende Second");
        assertThat(plainText).doesNotContain("image", "https://cdn/x.png");
    }

    @Test
    void collectsTheMediaItActuallyShows() {
        String body = """
                {"blocks": [
                  {"type": "image", "mediaId": 42},
                  {"type": "gallery", "items": [{"mediaId": 7}, {"mediaId": 42}]}
                ]}
                """;

        assertThat(articleBody.mediaIds(body)).containsExactly(42L, 7L);
    }

    @Test
    @DisplayName("reading time is at least a minute, so an empty estimate never shows 0 min")
    void estimatesReadingTime() {
        assertThat(articleBody.readingMinutes("")).isEqualTo(1);
        assertThat(articleBody.readingMinutes("mot ".repeat(200).trim())).isEqualTo(1);
        assertThat(articleBody.readingMinutes("mot ".repeat(201).trim())).isEqualTo(2);
    }

    @Test
    void refusesABodyThatIsNotJson() {
        assertThatThrownBy(() -> articleBody.toPlainText("{not json"))
                .isInstanceOf(IllegalArgumentException.class);
    }
}
