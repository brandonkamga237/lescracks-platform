package com.brandonkamga.lescracks.cracklab.infra;

import java.awt.BasicStroke;
import java.awt.Color;
import java.awt.Font;
import java.awt.Graphics2D;
import java.awt.Stroke;
import java.awt.geom.Ellipse2D;
import java.awt.geom.Path2D;
import java.awt.geom.Rectangle2D;
import java.awt.geom.RoundRectangle2D;
import java.text.Normalizer;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * The challenge's system diagram, drawn on a share card. Same algorithm and seed as the site's
 * Schematic component, so the preview shows the drawing people find on the page.
 */
final class SchematicPainter {

    private enum Kind { CLIENT, EDGE, SERVICE, DB, CACHE, QUEUE, STORE }

    private record Spec(Kind kind, String label) {
    }

    private record Node(Kind kind, String label, double x, double y) {
    }

    private static final double W = 320;
    private static final double H = 180;
    private static final double NODE_W = 52;
    private static final double NODE_H = 26;

    private static final Map<String, List<List<Spec>>> TEMPLATES = Map.of(
            "backend", List.of(col(s(Kind.CLIENT, "client")), col(s(Kind.EDGE, "api")), col(s(Kind.SERVICE, "service"), s(Kind.SERVICE, "worker")), col(s(Kind.DB, "postgres"), s(Kind.CACHE, "cache"))),
            "architecture", List.of(col(s(Kind.CLIENT, "client")), col(s(Kind.EDGE, "lb")), col(s(Kind.SERVICE, "svc-a"), s(Kind.SERVICE, "svc-b"), s(Kind.SERVICE, "svc-c")), col(s(Kind.QUEUE, "queue")), col(s(Kind.DB, "db"))),
            "database", List.of(col(s(Kind.SERVICE, "app")), col(s(Kind.EDGE, "pool")), col(s(Kind.DB, "primary")), col(s(Kind.DB, "replica"), s(Kind.DB, "replica"))),
            "devops", List.of(col(s(Kind.STORE, "repo")), col(s(Kind.EDGE, "ci")), col(s(Kind.STORE, "registry")), col(s(Kind.SERVICE, "node"), s(Kind.SERVICE, "node"), s(Kind.SERVICE, "node"))),
            "frontend", List.of(col(s(Kind.CLIENT, "browser")), col(s(Kind.EDGE, "cdn")), col(s(Kind.SERVICE, "ssr")), col(s(Kind.EDGE, "api"))),
            "securite", List.of(col(s(Kind.CLIENT, "client")), col(s(Kind.EDGE, "waf")), col(s(Kind.EDGE, "auth")), col(s(Kind.SERVICE, "api")), col(s(Kind.STORE, "vault"))),
            "mobile", List.of(col(s(Kind.CLIENT, "mobile")), col(s(Kind.STORE, "local")), col(s(Kind.EDGE, "sync")), col(s(Kind.DB, "db"))),
            "data", List.of(col(s(Kind.SERVICE, "source"), s(Kind.SERVICE, "source")), col(s(Kind.QUEUE, "stream")), col(s(Kind.SERVICE, "etl")), col(s(Kind.STORE, "warehouse"))),
            "cloud", List.of(col(s(Kind.CLIENT, "client")), col(s(Kind.EDGE, "dns")), col(s(Kind.SERVICE, "region-a"), s(Kind.SERVICE, "region-b")), col(s(Kind.DB, "db"))));

    private SchematicPainter() {
    }

    private static Spec s(Kind kind, String label) {
        return new Spec(kind, label);
    }

    @SafeVarargs
    private static List<Spec> col(Spec... specs) {
        return List.of(specs);
    }

    /** FNV-1a over UTF-16 code units, unsigned 32 bits: the same number the browser computes. */
    static long hash(String text) {
        int value = 0x811C9DC5;
        for (int i = 0; i < text.length(); i++) {
            value = (value ^ text.charAt(i)) * 16777619;
        }
        return value & 0xFFFFFFFFL;
    }

    private static String normalize(String category) {
        return Normalizer.normalize(category, Normalizer.Form.NFD).replaceAll("\\p{M}", "").toLowerCase(Locale.ROOT).trim();
    }

    /** Draws the diagram centred in the box, scaled to fit, keeping its proportions. */
    static void paint(Graphics2D g, String seed, String category, Font mono, double boxX, double boxY, double boxW, double boxH) {
        long h = hash(seed);
        List<List<Spec>> columns = new ArrayList<>();
        for (List<Spec> column : TEMPLATES.getOrDefault(normalize(category), TEMPLATES.get("backend"))) {
            columns.add(new ArrayList<>(column));
        }
        int middle = 1 + (int) (h % Math.max(1, columns.size() - 2));
        if ((h >>> 3) % 2 == 0 && columns.get(middle).size() < 3) {
            columns.get(middle).add(columns.get(middle).get(0));
        } else if (columns.get(middle).size() > 1) {
            columns.get(middle).remove(columns.get(middle).size() - 1);
        }

        double margin = 34;
        double step = (W - margin * 2) / (columns.size() - 1);
        List<List<Node>> placed = new ArrayList<>();
        for (int c = 0; c < columns.size(); c++) {
            List<Spec> column = columns.get(c);
            List<Node> nodes = new ArrayList<>();
            for (int r = 0; r < column.size(); r++) {
                nodes.add(new Node(column.get(r).kind(), column.get(r).label(), margin + c * step, H / 2 + (r - (column.size() - 1) / 2.0) * (NODE_H + 16)));
            }
            placed.add(nodes);
        }
        List<Node> candidates = placed.subList(1, placed.size()).stream().flatMap(List::stream).toList();
        Node hot = candidates.get((int) ((h >>> 5) % candidates.size()));

        List<Node> all = placed.stream().flatMap(List::stream).toList();
        List<Node> inner = placed.subList(1, placed.size() - 1).stream().flatMap(List::stream).toList();
        double pad = 14;
        double minX = all.stream().mapToDouble(Node::x).min().orElse(0) - NODE_W / 2 - pad;
        double maxX = all.stream().mapToDouble(Node::x).max().orElse(W) + NODE_W / 2 + pad;
        double minY = all.stream().mapToDouble(n -> n.y() - NODE_H / 2).min().orElse(0) - pad;
        double maxY = all.stream().mapToDouble(n -> n.y() + NODE_H / 2).max().orElse(H) + pad;
        if (!inner.isEmpty()) {
            minY = Math.min(minY, inner.stream().mapToDouble(Node::y).min().orElse(0) - NODE_H / 2 - 10 - pad);
            maxY = Math.max(maxY, inner.stream().mapToDouble(Node::y).max().orElse(0) + NODE_H / 2 + 10 + pad);
        }
        double scale = Math.min(boxW / (maxX - minX), boxH / (maxY - minY));
        double offsetX = boxX + (boxW - (maxX - minX) * scale) / 2 - minX * scale;
        double offsetY = boxY + (boxH - (maxY - minY) * scale) / 2 - minY * scale;

        Graphics2D d = (Graphics2D) g.create();
        try {
            d.translate(offsetX, offsetY);
            d.scale(scale, scale);
            Stroke line = new BasicStroke(1f / (float) scale * 1.6f);
            Color structure = new Color(255, 255, 255, 150);
            Color faint = new Color(255, 255, 255, 80);
            Color gold = new Color(0xD4, 0xAF, 0x37);

            if (!inner.isEmpty()) {
                double bx = inner.stream().mapToDouble(Node::x).min().orElse(0) - NODE_W / 2 - 8;
                double by = inner.stream().mapToDouble(Node::y).min().orElse(0) - NODE_H / 2 - 10;
                double bw = inner.stream().mapToDouble(Node::x).max().orElse(0) + NODE_W / 2 + 8 - bx;
                double bh = inner.stream().mapToDouble(Node::y).max().orElse(0) + NODE_H / 2 + 10 - by;
                d.setColor(new Color(255, 255, 255, 50));
                d.setStroke(new BasicStroke(1f / (float) scale * 1.4f, BasicStroke.CAP_BUTT, BasicStroke.JOIN_MITER, 10f,
                        new float[]{2f, 3f}, 0f));
                d.draw(new RoundRectangle2D.Double(bx, by, bw, bh, 8, 8));
            }

            d.setStroke(line);
            for (int c = 0; c < placed.size() - 1; c++) {
                List<Node> from = placed.get(c);
                List<Node> to = placed.get(c + 1);
                for (Node a : from) {
                    for (Node b : to) {
                        if (from.size() > 1 && to.size() > 1 && from.indexOf(a) != to.indexOf(b)) {
                            continue;
                        }
                        double x1 = a.x() + NODE_W / 2;
                        double x2 = b.x() - NODE_W / 2 - 3;
                        double mid = (x1 + x2) / 2;
                        Path2D path = new Path2D.Double();
                        path.moveTo(x1, a.y());
                        if (a.y() != b.y()) {
                            path.lineTo(mid, a.y());
                            path.lineTo(mid, b.y());
                        }
                        path.lineTo(x2, b.y());
                        d.setColor(b == hot ? gold : faint);
                        d.draw(path);
                        Path2D arrow = new Path2D.Double();
                        arrow.moveTo(x2 - 4, b.y() - 2.5);
                        arrow.lineTo(x2, b.y());
                        arrow.lineTo(x2 - 4, b.y() + 2.5);
                        d.draw(arrow);
                    }
                }
            }

            d.setFont(mono.deriveFont(7.5f));
            for (Node node : all) {
                boolean isHot = node == hot;
                List<java.awt.Shape> shapes = shapes(node);
                d.setColor(isHot ? new Color(212, 175, 55, 26) : new Color(0x0D, 0x0D, 0x0D));
                d.fill(shapes.get(0));
                d.setColor(isHot ? gold : structure);
                if (node.kind() == Kind.CACHE) {
                    d.setStroke(new BasicStroke(1f / (float) scale * 1.6f, BasicStroke.CAP_BUTT, BasicStroke.JOIN_MITER, 10f, new float[]{3f, 2f}, 0f));
                } else {
                    d.setStroke(line);
                }
                shapes.forEach(d::draw);
                double labelX = node.kind() == Kind.QUEUE ? node.x() - 9 : node.x();
                double labelY = node.y() + (node.kind() == Kind.DB ? 6 : node.kind() == Kind.CLIENT ? 5 : 3);
                int width = d.getFontMetrics().stringWidth(node.label());
                d.drawString(node.label(), (float) (labelX - width / 2.0), (float) labelY);
            }
        } finally {
            d.dispose();
        }
    }

    /** The outline first (filled to hide the edges behind it), then any inner strokes. */
    private static List<java.awt.Shape> shapes(Node node) {
        double left = node.x() - NODE_W / 2;
        double top = node.y() - NODE_H / 2;
        return switch (node.kind()) {
            case CLIENT -> List.of(new RoundRectangle2D.Double(left, top, NODE_W, NODE_H, 4, 4),
                    new Rectangle2D.Double(left, top + 6, NODE_W, 0));
            case EDGE -> List.of(new RoundRectangle2D.Double(left, top, NODE_W, NODE_H, NODE_H, NODE_H));
            case DB -> {
                Path2D body = new Path2D.Double();
                body.moveTo(left, top + 4);
                body.lineTo(left, top + NODE_H - 4);
                body.append(new java.awt.geom.Arc2D.Double(left, top + NODE_H - 8, NODE_W, 8, 180, 180, java.awt.geom.Arc2D.OPEN), true);
                body.lineTo(left + NODE_W, top + 4);
                yield List.of(body, new Ellipse2D.Double(left, top, NODE_W, 8));
            }
            case QUEUE -> {
                List<java.awt.Shape> parts = new ArrayList<>();
                parts.add(new RoundRectangle2D.Double(left, top, NODE_W, NODE_H, 4, 4));
                for (int i = 1; i <= 3; i++) {
                    parts.add(new Rectangle2D.Double(left + NODE_W - i * 6, top + 5, 0, NODE_H - 10));
                }
                yield parts;
            }
            case STORE -> {
                Path2D outline = new Path2D.Double();
                outline.moveTo(left, top);
                outline.lineTo(left + NODE_W - 8, top);
                outline.lineTo(left + NODE_W, top + 8);
                outline.lineTo(left + NODE_W, top + NODE_H);
                outline.lineTo(left, top + NODE_H);
                outline.closePath();
                Path2D fold = new Path2D.Double();
                fold.moveTo(left + NODE_W - 8, top);
                fold.lineTo(left + NODE_W - 8, top + 8);
                fold.lineTo(left + NODE_W, top + 8);
                yield List.of(outline, fold);
            }
            default -> List.of(new RoundRectangle2D.Double(left, top, NODE_W, NODE_H, 4, 4));
        };
    }
}
