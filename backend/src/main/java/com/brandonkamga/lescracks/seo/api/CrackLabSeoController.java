package com.brandonkamga.lescracks.seo.api;

import com.brandonkamga.lescracks.cracklab.domain.Challenge;
import com.brandonkamga.lescracks.cracklab.domain.ChallengeCriterion;
import com.brandonkamga.lescracks.cracklab.domain.ChallengeDifficulty;
import com.brandonkamga.lescracks.cracklab.domain.ChallengeService;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Server-rendered CrackLab pages for crawlers and link previews. The statement and the rubric
 * are public; the reference solution is never rendered here.
 */
@RestController
@RequestMapping("/seo/cracklab")
public class CrackLabSeoController {

    private static final String PREVIEW_IMAGE = "/preview.jpg";
    private static final int PREVIEW_WIDTH = 1296;
    private static final int PREVIEW_HEIGHT = 614;
    private static final Map<ChallengeDifficulty, String> LEVEL = Map.of(
            ChallengeDifficulty.BEGINNER, "Débutant",
            ChallengeDifficulty.INTERMEDIATE, "Intermédiaire",
            ChallengeDifficulty.ADVANCED, "Avancé");

    private final ChallengeService challenges;
    private final ObjectMapper objectMapper;

    public CrackLabSeoController(ChallengeService challenges, ObjectMapper objectMapper) {
        this.challenges = challenges;
        this.objectMapper = objectMapper;
    }

    @GetMapping(produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<String> home(HttpServletRequest request) {
        String canonical = baseUrl(request) + "/cracklab";
        SeoHtml html = new SeoHtml("CrackLab · Challenges d’ingénierie · LesCracks",
                "Des problèmes d’ingénierie réels : rédige ta solution, reçois une note critère par critère et compare-la aux autres réponses.",
                canonical)
                .type("website")
                .image(baseUrl(request) + PREVIEW_IMAGE, "CrackLab par LesCracks", PREVIEW_WIDTH, PREVIEW_HEIGHT);
        html.heading("CrackLab : challenges d’ingénierie");
        html.paragraph("Chaque challenge est un problème technique réel, noté sur une grille publique. Plusieurs solutions sont possibles : c’est le raisonnement qui est évalué.");

        var published = challenges.published(null, null, null, PageRequest.of(0, 100, Sort.by(Sort.Direction.DESC, "publishedAt")));
        if (published.isEmpty()) {
            html.paragraph("Le premier challenge se prépare.");
        } else {
            List<SeoHtml.Link> links = new ArrayList<>();
            published.forEach(challenge -> links.add(new SeoHtml.Link(baseUrl(request) + "/cracklab/challenges/" + challenge.getSlug(), challenge.getTitle())));
            html.links("Les challenges", links);
        }
        return ResponseEntity.ok(html.render());
    }

    @GetMapping(value = "/challenges/{slug}", produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<String> challenge(@PathVariable String slug, HttpServletRequest request) {
        Challenge challenge = challenges.requirePublished(slug);
        String base = baseUrl(request);
        String canonical = base + "/cracklab/challenges/" + challenge.getSlug();
        String statement = plain(challenge.getProblem());
        String description = "Challenge " + challenge.getCategory() + " · " + LEVEL.get(challenge.getDifficulty()) + " : "
                + (statement.length() > 150 ? statement.substring(0, 150).trim() + "…" : statement);

        SeoHtml html = new SeoHtml(challenge.getTitle() + " · CrackLab", description, canonical)
                .type("article")
                .image(base + PREVIEW_IMAGE, challenge.getTitle(), PREVIEW_WIDTH, PREVIEW_HEIGHT);
        html.breadcrumbs(List.of(
                new SeoHtml.Link(base + "/", "Accueil"),
                new SeoHtml.Link(base + "/cracklab", "CrackLab"),
                new SeoHtml.Link(canonical, challenge.getTitle())));
        html.heading(challenge.getTitle());
        html.fact("Catégorie", challenge.getCategory());
        html.fact("Niveau", LEVEL.get(challenge.getDifficulty()));
        html.fact("Tags", String.join(", ", challenge.getTags()));
        html.fact("Format attendu", challenge.getExpectedFormat());
        html.paragraph(statement);
        if (challenge.getConstraints() != null) {
            html.fact("Contraintes", plain(challenge.getConstraints()));
        }
        for (ChallengeCriterion criterion : challenge.getCriteria()) {
            html.fact(criterion.getLabel(), criterion.getMaxPoints() + " points");
        }

        Map<String, Object> jsonLd = new LinkedHashMap<>();
        jsonLd.put("@context", "https://schema.org");
        jsonLd.put("@type", "LearningResource");
        jsonLd.put("name", challenge.getTitle());
        jsonLd.put("description", description);
        jsonLd.put("url", canonical);
        jsonLd.put("inLanguage", "fr");
        jsonLd.put("educationalLevel", LEVEL.get(challenge.getDifficulty()));
        jsonLd.put("learningResourceType", "Challenge");
        jsonLd.put("keywords", String.join(", ", challenge.getTags()));
        jsonLd.put("isAccessibleForFree", true);
        jsonLd.put("provider", Map.of("@type", "Organization", "name", "LesCracks", "url", base));
        html.jsonLd(json(jsonLd));
        return ResponseEntity.ok(html.render());
    }

    /** Markdown down to prose a crawler can index: fences, heading marks, emphasis and link syntax removed. */
    static String plain(String markdown) {
        if (markdown == null) {
            return "";
        }
        return markdown
                .replaceAll("(?m)^```.*$", "")
                .replaceAll("!\\[([^]]*)]\\([^)]*\\)", "$1")
                .replaceAll("\\[([^]]+)]\\([^)]*\\)", "$1")
                .replaceAll("(?m)^\\s{0,3}(#{1,6}|>|[-*+]|\\d+[.)])\\s+", "")
                .replaceAll("[*_`]", "")
                .replaceAll("\\s+", " ")
                .trim();
    }

    /** JSON-LD sits inside a script tag: a literal "</script>" in a statement must not close it. */
    private String json(Map<String, Object> value) {
        try {
            return objectMapper.writeValueAsString(value).replace("<", "\\u003c");
        } catch (Exception e) {
            throw new IllegalStateException("Cannot render JSON-LD", e);
        }
    }

    private static String baseUrl(HttpServletRequest request) {
        String scheme = request.getScheme();
        int port = request.getServerPort();
        boolean defaultPort = ("http".equals(scheme) && port == 80) || ("https".equals(scheme) && port == 443);
        return scheme + "://" + request.getServerName() + (defaultPort ? "" : ":" + port);
    }
}
