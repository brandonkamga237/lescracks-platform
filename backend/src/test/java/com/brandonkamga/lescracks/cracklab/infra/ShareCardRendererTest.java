package com.brandonkamga.lescracks.cracklab.infra;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Link-preview images: the size every network expects, and light enough for WhatsApp, which
 * drops preview images that are too heavy. The images land in target/share-cards for a look.
 */
class ShareCardRendererTest {

    private final ShareCardRenderer renderer = new ShareCardRenderer();

    private static BufferedImage check(String name, byte[] png) throws IOException {
        Path out = Path.of("target", "share-cards");
        Files.createDirectories(out);
        Files.write(out.resolve(name + ".png"), png);
        assertThat(png.length).as(name + " weight").isLessThan(300 * 1024);
        return ImageIO.read(new ByteArrayInputStream(png));
    }

    @Test
    @DisplayName("every card is a 1200×630 PNG under 300 KB, even with a very long title")
    void cardsFitPreviewConstraints() throws IOException {
        List<BufferedImage> cards = List.of(
                check("challenge", renderer.challenge("api-de-paiement", "Une API de paiement qui s’effondre sous la charge du vendredi soir et du Black Friday réunis",
                        "Intermédiaire", 2, "Backend", "12 participants · moyenne 64/100")),
                check("result", renderer.result("Awa N.", "78", "100", "Une API de paiement qui s’effondre sous la charge",
                        "Mieux que 72 % des participants", "Apprenti")),
                check("ranking", renderer.ranking("Classement CrackLab", List.of(
                        new ShareCardRenderer.Row("1", "Moussa D.", "245"),
                        new ShareCardRenderer.Row("2", "Awa N.", "178"),
                        new ShareCardRenderer.Row("3", "Inès K.", "150")))),
                check("member", renderer.member("Awa Ndiaye-Kamga", "Apprenti", "178", "#2", "3 sem.", "4/7")),
                check("ranking-empty", renderer.ranking("Cette semaine", List.of())));

        assertThat(cards).allSatisfy(card -> {
            assertThat(card.getWidth()).isEqualTo(ShareCardRenderer.WIDTH);
            assertThat(card.getHeight()).isEqualTo(ShareCardRenderer.HEIGHT);
        });
    }
}
