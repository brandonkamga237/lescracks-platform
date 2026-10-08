package com.brandonkamga.lescracks.cracklab.infra;

import org.springframework.stereotype.Component;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.util.ArrayList;
import java.util.List;

/**
 * Draws the 1200×630 images link previews show (WhatsApp, LinkedIn, X…): the CrackLab frame
 * plus the figures that make someone want to click — a challenge's level and participation, a
 * score, a podium, a member's level. Fonts ship with the app; the server's fonts are never used.
 */
@Component
public class ShareCardRenderer {

    public static final int WIDTH = 1200;
    public static final int HEIGHT = 630;
    private static final int MARGIN = 72;

    private static final Color BACKGROUND = new Color(0x0A, 0x0A, 0x0A);
    private static final Color GOLD = new Color(0xD4, 0xAF, 0x37);
    private static final Color WHITE = Color.WHITE;
    private static final Color MUTED = new Color(255, 255, 255, 150);
    private static final Color FAINT = new Color(255, 255, 255, 90);
    private static final Color LINE = new Color(255, 255, 255, 30);

    private final Font sansBold;
    private final Font sansMedium;
    private final Font monoBold;
    private final Font monoMedium;

    public ShareCardRenderer() {
        this.sansBold = load("fonts/DMSans-Bold.ttf");
        this.sansMedium = load("fonts/DMSans-Medium.ttf");
        this.monoBold = load("fonts/JetBrainsMono-Bold.ttf");
        this.monoMedium = load("fonts/JetBrainsMono-Medium.ttf");
    }

    public record Row(String rank, String name, String score) {
    }

    /** seed: the challenge slug, which picks its diagram; level: 1 to 3 bars; stats: "12 participants · moyenne 64/100". */
    public byte[] challenge(String seed, String title, String difficulty, int level, String category, String stats) {
        return render("CHALLENGE", "Relève le défi sur lescracks.com", g -> {
            int column = 600;
            int y = 196;
            drawBars(g, MARGIN, y - 22, level);
            g.setFont(monoBold.deriveFont(20f));
            g.setColor(WHITE);
            g.drawString(difficulty.toUpperCase(), MARGIN + 44, y);
            g.setColor(FAINT);
            g.drawString(category, MARGIN + 64 + g.getFontMetrics().stringWidth(difficulty.toUpperCase()), y);
            int bottom = drawWrapped(g, title, sansBold, 58f, 42f, MARGIN, y + 30, column - MARGIN, 4, WHITE);
            g.setFont(monoMedium.deriveFont(22f));
            g.setColor(MUTED);
            g.drawString(stats, MARGIN, Math.min(bottom + 58, HEIGHT - 132));
            int boxX = column + 48;
            g.setColor(LINE);
            g.setStroke(new BasicStroke(1.5f));
            g.drawRoundRect(boxX, 150, WIDTH - MARGIN - boxX, 300, 10, 10);
            SchematicPainter.paint(g, seed, category, monoMedium, boxX + 16, 166, WIDTH - MARGIN - boxX - 32, 268);
        });
    }

    public byte[] result(String member, String score, String total, String challengeTitle, String standing, String level) {
        return render("RÉSULTAT", "À ton tour sur lescracks.com", g -> {
            g.setFont(sansMedium.deriveFont(30f));
            g.setColor(MUTED);
            g.drawString(member + " a obtenu", MARGIN, 200);
            g.setFont(sansBold.deriveFont(200f));
            g.setColor(WHITE);
            g.drawString(score, MARGIN - 8, 380);
            int scoreWidth = g.getFontMetrics().stringWidth(score);
            g.setFont(sansBold.deriveFont(64f));
            g.setColor(FAINT);
            g.drawString("/" + total, MARGIN + scoreWidth, 380);
            int column = 640;
            g.setFont(monoBold.deriveFont(18f));
            g.setColor(GOLD);
            g.drawString("SUR LE CHALLENGE", column, 196);
            int bottom = drawWrapped(g, challengeTitle, sansBold, 40f, 34f, column, 236, WIDTH - column - MARGIN, 3, WHITE);
            g.setFont(sansMedium.deriveFont(26f));
            g.setColor(GOLD);
            if (!standing.isBlank()) {
                g.drawString(standing, column, bottom + 44);
            }
            drawChip(g, "Niveau " + level, column, bottom + 76);
        });
    }

    public byte[] ranking(String heading, List<Row> podium) {
        return render("CLASSEMENT", "Prends ta place sur lescracks.com", g -> {
            g.setFont(sansBold.deriveFont(60f));
            g.setColor(WHITE);
            g.drawString(heading, MARGIN, 200);
            if (podium.isEmpty()) {
                g.setFont(sansMedium.deriveFont(32f));
                g.setColor(MUTED);
                g.drawString("Le podium est libre : la première réponse notée le prend.", MARGIN, 300);
                return;
            }
            int y = 290;
            for (Row row : podium) {
                g.setFont(monoBold.deriveFont(44f));
                g.setColor(GOLD);
                g.drawString(row.rank(), MARGIN, y);
                g.setFont(sansBold.deriveFont(40f));
                g.setColor(WHITE);
                g.drawString(ellipsize(g, row.name(), 640), MARGIN + 80, y);
                g.setFont(monoBold.deriveFont(40f));
                int width = g.getFontMetrics().stringWidth(row.score());
                g.drawString(row.score(), WIDTH - MARGIN - width, y);
                g.setColor(LINE);
                g.fillRect(MARGIN, y + 24, WIDTH - 2 * MARGIN, 1);
                y += 82;
            }
        });
    }

    public byte[] member(String name, String level, String xp, String rank, String streak, String badges) {
        return render("PROFIL", "Mesure-toi à ce profil sur lescracks.com", g -> {
            int nameBaseline = drawWrapped(g, name, sansBold, 76f, 56f, MARGIN, 150, WIDTH - 2 * MARGIN, 1, WHITE);
            drawChip(g, "Niveau " + level, MARGIN, nameBaseline + 28);
            String[][] figures = {{xp, "XP"}, {rank, "CLASSEMENT"}, {streak, "SÉRIE"}, {badges, "BADGES"}};
            int column = (WIDTH - 2 * MARGIN) / figures.length;
            for (int i = 0; i < figures.length; i++) {
                int x = MARGIN + i * column;
                g.setFont(sansBold.deriveFont(64f));
                g.setColor(i == 0 ? GOLD : WHITE);
                g.drawString(figures[i][0], x, 420);
                g.setFont(monoBold.deriveFont(18f));
                g.setColor(FAINT);
                g.drawString(figures[i][1], x, 456);
            }
        });
    }

    private interface Painter {
        void paint(Graphics2D g);
    }

    private byte[] render(String kind, String callToAction, Painter painter) {
        BufferedImage image = new BufferedImage(WIDTH, HEIGHT, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = image.createGraphics();
        try {
            g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
            g.setRenderingHint(RenderingHints.KEY_TEXT_ANTIALIASING, RenderingHints.VALUE_TEXT_ANTIALIAS_ON);
            g.setRenderingHint(RenderingHints.KEY_FRACTIONALMETRICS, RenderingHints.VALUE_FRACTIONALMETRICS_ON);
            g.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);

            g.setColor(BACKGROUND);
            g.fillRect(0, 0, WIDTH, HEIGHT);

            g.setFont(monoBold.deriveFont(32f));
            g.setColor(WHITE);
            g.drawString("Crack", MARGIN, 96);
            int crack = g.getFontMetrics().stringWidth("Crack");
            g.setColor(GOLD);
            g.drawString("Lab", MARGIN + crack, 96);
            int lab = g.getFontMetrics().stringWidth("Lab");
            g.setFont(monoMedium.deriveFont(16f));
            g.setColor(FAINT);
            g.drawString("PAR LESCRACKS", MARGIN + crack + lab + 18, 94);

            g.setFont(monoMedium.deriveFont(18f));
            int kindWidth = g.getFontMetrics().stringWidth(kind);
            g.setColor(FAINT);
            g.drawString(kind, WIDTH - MARGIN - kindWidth, 94);
            g.setColor(LINE);
            g.fillRect(MARGIN, 122, WIDTH - 2 * MARGIN, 1);

            painter.paint(g);

            g.setColor(LINE);
            g.fillRect(MARGIN, HEIGHT - 104, WIDTH - 2 * MARGIN, 1);
            g.setFont(sansBold.deriveFont(28f));
            g.setColor(GOLD);
            g.drawString(callToAction, MARGIN, HEIGHT - 52);
            // Drawn, not typed: the bundled Latin subsets have no arrow glyph.
            int arrowX = MARGIN + g.getFontMetrics().stringWidth(callToAction) + 18;
            int arrowY = HEIGHT - 61;
            g.setStroke(new BasicStroke(3f, BasicStroke.CAP_ROUND, BasicStroke.JOIN_ROUND));
            g.drawLine(arrowX, arrowY, arrowX + 26, arrowY);
            g.drawLine(arrowX + 16, arrowY - 9, arrowX + 26, arrowY);
            g.drawLine(arrowX + 16, arrowY + 9, arrowX + 26, arrowY);
        } finally {
            g.dispose();
        }
        return png(image);
    }

    private void drawBars(Graphics2D g, int x, int baseline, int level) {
        for (int bar = 0; bar < 3; bar++) {
            int height = 10 + bar * 6;
            g.setColor(bar < level ? GOLD : new Color(255, 255, 255, 40));
            g.fillRoundRect(x + bar * 11, baseline + 24 - height, 7, height, 2, 2);
        }
    }

    /** A hairline tag, as on the site: no fill, the text carries the accent. */
    private void drawChip(Graphics2D g, String text, int x, int top) {
        g.setFont(monoMedium.deriveFont(20f));
        int width = g.getFontMetrics().stringWidth(text) + 28;
        g.setColor(LINE);
        g.setStroke(new BasicStroke(1.5f));
        g.drawRoundRect(x, top, width, 40, 6, 6);
        g.setColor(GOLD);
        g.drawString(text, x + 14, top + 27);
    }

    /** Word-wraps into at most `maxLines`, shrinking toward `minSize` before cutting with an ellipsis. Returns the last baseline. */
    private int drawWrapped(Graphics2D g, String text, Font font, float size, float minSize, int x, int top, int width, int maxLines, Color color) {
        List<String> lines = List.of();
        float current = size;
        while (current >= minSize) {
            g.setFont(font.deriveFont(current));
            lines = wrap(g, text, width);
            if (lines.size() <= maxLines) {
                break;
            }
            current -= 4;
        }
        if (lines.size() > maxLines) {
            List<String> cut = new ArrayList<>(lines.subList(0, maxLines));
            cut.set(maxLines - 1, ellipsize(g, cut.get(maxLines - 1) + " …", width));
            lines = cut;
        }
        g.setColor(color);
        int lineHeight = Math.round(current * 1.08f);
        int baseline = top + Math.round(current);
        for (String line : lines) {
            g.drawString(line, x, baseline);
            baseline += lineHeight;
        }
        return baseline - lineHeight;
    }

    private static List<String> wrap(Graphics2D g, String text, int width) {
        List<String> lines = new ArrayList<>();
        StringBuilder line = new StringBuilder();
        for (String word : text.trim().split("\\s+")) {
            String candidate = line.isEmpty() ? word : line + " " + word;
            if (g.getFontMetrics().stringWidth(candidate) > width && !line.isEmpty()) {
                lines.add(line.toString());
                line = new StringBuilder(word);
            } else {
                line = new StringBuilder(candidate);
            }
        }
        if (!line.isEmpty()) {
            lines.add(line.toString());
        }
        return lines;
    }

    private static String ellipsize(Graphics2D g, String text, int width) {
        FontMetrics metrics = g.getFontMetrics();
        if (metrics.stringWidth(text) <= width) {
            return text;
        }
        String cut = text;
        while (!cut.isEmpty() && metrics.stringWidth(cut + "…") > width) {
            cut = cut.substring(0, cut.length() - 1);
        }
        return cut.stripTrailing() + "…";
    }

    private static Font load(String path) {
        try (InputStream in = ShareCardRenderer.class.getClassLoader().getResourceAsStream(path)) {
            if (in == null) {
                throw new IllegalStateException("Missing font " + path);
            }
            return Font.createFont(Font.TRUETYPE_FONT, in);
        } catch (FontFormatException | IOException e) {
            throw new IllegalStateException("Cannot load font " + path, e);
        }
    }

    private static byte[] png(BufferedImage image) {
        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            ImageIO.write(image, "png", out);
            return out.toByteArray();
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
    }
}
