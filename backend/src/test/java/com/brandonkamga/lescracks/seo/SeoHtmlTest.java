package com.brandonkamga.lescracks.seo;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class SeoHtmlTest {

    private final ObjectMapper json = new ObjectMapper();

    @Test
    @DisplayName("a title carrying markup cannot break out of the tag")
    void escapesMarkupInText() {
        String page = new SeoHtml("<script>alert(1)</script>", "d", "https://lescracks.com/")
                .render();

        assertThat(page).doesNotContain("<script>alert");
        assertThat(page).contains("&lt;script&gt;");
    }

    @Test
    @DisplayName("a quote in a title cannot end the attribute it sits in")
    void escapesQuotesInAttributes() {
        String page = new SeoHtml("Le \"meilleur\" bootcamp", "d", "https://lescracks.com/").render();

        assertThat(page).contains("content=\"Le &quot;meilleur&quot; bootcamp\"");
    }

    @Test
    @DisplayName("</script> inside JSON-LD cannot close the block early")
    void escapesScriptEndInJsonLd() {
        String literal = SeoHtml.json("fin </script> suite");

        assertThat(literal).doesNotContain("</script>");
        assertThat(literal).contains("\\u003c/script>");
    }

    @Test
    @DisplayName("the JSON-LD it emits is parseable JSON")
    void producesValidJsonLiterals() throws Exception {
        String awkward = "Ligne 1\nTabulation\tGuillemet \" antislash \\ et \u0007";

        assertThat(json.readTree(SeoHtml.json(awkward)).asText()).isEqualTo(awkward);
    }

    @Test
    @DisplayName("a null escapes to nothing rather than the word null")
    void nullsBecomeEmpty() {
        assertThat(SeoHtml.escape(null)).isEmpty();
        assertThat(SeoHtml.json(null)).isEqualTo("\"\"");
    }

    @Test
    @DisplayName("a page carries the head a crawler reads")
    void rendersTheExpectedHead() {
        String page = new SeoHtml("Titre", "Description", "https://lescracks.com/x")
                .image("https://cdn.lescracks.com/a.png")
                .heading("Titre")
                .paragraph("Corps")
                .fact("Lieu :", "Douala")
                .render();

        assertThat(page)
                .startsWith("<!doctype html><html lang=\"fr\">")
                .contains("<title>Titre</title>")
                .contains("<link rel=\"canonical\" href=\"https://lescracks.com/x\">")
                .contains("<meta property=\"og:image\" content=\"https://cdn.lescracks.com/a.png\">")
                .contains("<h1>Titre</h1>")
                .contains("<p>Corps</p>")
                .contains("<strong>Lieu :</strong> Douala")
                .endsWith("</body></html>");
    }

    @Test
    @DisplayName("empty prose and a missing image leave no empty tags behind")
    void skipsEmptyContent() {
        String page = new SeoHtml("T", "D", "https://lescracks.com/")
                .image(null)
                .paragraph("")
                .paragraph(null)
                .fact("Lieu :", null)
                .render();

        assertThat(page).doesNotContain("<p></p>", "og:image", "<strong>Lieu :</strong>");
    }
}
