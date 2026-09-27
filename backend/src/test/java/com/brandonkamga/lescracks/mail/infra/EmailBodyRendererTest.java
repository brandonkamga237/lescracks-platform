package com.brandonkamga.lescracks.mail.infra;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import java.util.function.UnaryOperator;

import static org.assertj.core.api.Assertions.assertThat;

class EmailBodyRendererTest {

    private final EmailBodyRenderer renderer = new EmailBodyRenderer();
    private final ObjectMapper mapper = new ObjectMapper();

    private JsonNode blocks(String json) throws Exception {
        return mapper.readTree(json);
    }

    @Test
    void rendersTheBlocksAsEmailHtml() throws Exception {
        String html = renderer.render(blocks("""
                [
                  {"type": "heading", "level": 2, "text": "Bienvenue"},
                  {"type": "paragraph", "text": "Un **gras** et du `code`"},
                  {"type": "quote", "text": "Une pensée"},
                  {"type": "list", "items": [{"text": "Un"}, {"text": ""}, {"text": "Deux"}]},
                  {"type": "divider"},
                  {"type": "link", "url": "https://lescracks.com", "text": "Le site"}
                ]
                """), UnaryOperator.identity());

        assertThat(html)
                .contains("<h2", "Bienvenue")
                .contains("<strong", "gras")
                .contains("<code", "code")
                .contains("<blockquote", "Une pensée")
                .contains("<li", "Un", "Deux")
                .contains("<hr")
                .contains("href=\"https://lescracks.com\"", ">Le site<")
                .doesNotContain("Un&#", "{{");
    }

    @Test
    void personalisesProseBeforeRendering() throws Exception {
        String html = renderer.render(blocks("""
                [{"type": "paragraph", "text": "Bonjour {{firstName}}"}]
                """), text -> text.replace("{{firstName}}", "Marie"));

        assertThat(html).contains("Bonjour Marie").doesNotContain("{{firstName}}");
    }

    @Test
    void escapesEverythingTheAdminTypes() throws Exception {
        String html = renderer.render(blocks("""
                [{"type": "paragraph", "text": "<img onerror=x> & <script>alert(1)</script>"}]
                """), UnaryOperator.identity());

        assertThat(html).doesNotContain("<script", "<img onerror").contains("&lt;img");
    }

    @Test
    void dropsLinksThatAreNotHttp() throws Exception {
        String html = renderer.render(blocks("""
                [
                  {"type": "link", "url": "javascript:alert(1)", "text": "piège"},
                  {"type": "image", "url": "javascript:alert(1)"},
                  {"type": "paragraph", "text": "[ok](javascript:alert(1))"}
                ]
                """), UnaryOperator.identity());

        assertThat(html).doesNotContain("javascript:");
    }

    @Test
    void rendersNothingForAnEmptyDocument() throws Exception {
        assertThat(renderer.render(blocks("[]"), UnaryOperator.identity())).isEmpty();
        assertThat(renderer.render(blocks("{}"), UnaryOperator.identity())).isEmpty();
    }
}
