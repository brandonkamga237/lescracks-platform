package com.brandonkamga.lescracks.seo.api;

import com.brandonkamga.lescracks.cracklab.domain.Challenge;
import com.brandonkamga.lescracks.cracklab.domain.ChallengeCriterion;
import com.brandonkamga.lescracks.cracklab.domain.ChallengeDifficulty;
import com.brandonkamga.lescracks.cracklab.domain.ChallengeService;
import com.brandonkamga.lescracks.cracklab.domain.ChallengeStats;
import com.brandonkamga.lescracks.cracklab.domain.CrackLabMapper;
import com.brandonkamga.lescracks.cracklab.domain.MemberProgress;
import com.brandonkamga.lescracks.cracklab.domain.ProgressService;
import com.brandonkamga.lescracks.cracklab.domain.PublicResult;
import com.brandonkamga.lescracks.cracklab.domain.SubmissionService;
import com.brandonkamga.lescracks.cracklab.domain.SubmissionStatus;
import com.brandonkamga.lescracks.cracklab.infra.SubmissionRepository;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
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

    private static final int CARD_WIDTH = 1200;
    private static final int CARD_HEIGHT = 630;

    private final ChallengeService challenges;
    private final SubmissionService submissions;
    private final ProgressService progress;
    private final ObjectMapper objectMapper;

    public CrackLabSeoController(ChallengeService challenges, SubmissionService submissions, ProgressService progress, ObjectMapper objectMapper) {
        this.challenges = challenges;
        this.submissions = submissions;
        this.progress = progress;
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
        ChallengeStats stats = progress.statsFor(challenge.getId());
        String crowd = stats.participants() == 0 ? "Sois le premier à répondre."
                : stats.participants() + " participant" + (stats.participants() > 1 ? "s" : "")
                + (stats.averageScore() == null ? "." : ", moyenne " + stats.averageScore() + "/" + challenge.totalPoints() + ".");
        String description = LEVEL.get(challenge.getDifficulty()) + " · " + challenge.getCategory() + ". " + crowd + " "
                + (statement.length() > 110 ? statement.substring(0, 110).trim() + "…" : statement);

        SeoHtml html = new SeoHtml(challenge.getTitle() + " · Challenge CrackLab", description, canonical)
                .type("article")
                .image(base + "/api/cracklab/share/challenges/" + challenge.getSlug() + ".png", challenge.getTitle(), CARD_WIDTH, CARD_HEIGHT);
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

    @GetMapping(value = "/classement", produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<String> ranking(@RequestParam(name = "periode", required = false) String period, HttpServletRequest request) {
        boolean week = "semaine".equals(period);
        String base = baseUrl(request);
        var rows = (week ? progress.weekRanking(PageRequest.of(0, 10)) : submissions.ranking(PageRequest.of(0, 10))).getContent();
        StringBuilder podium = new StringBuilder();
        for (int i = 0; i < Math.min(3, rows.size()); i++) {
            SubmissionRepository.RankingRow row = rows.get(i);
            podium.append(i == 0 ? "" : ", ").append(i + 1).append(". ")
                    .append(CrackLabMapper.displayName(row.getFirstName(), row.getLastName(), row.getUsername()))
                    .append(" ").append(row.getTotalScore()).append(" pts");
        }
        String description = (rows.isEmpty() ? "Le podium est libre." : podium + ".")
                + " Résous des challenges d’ingénierie notés sur 100 et prends ta place.";
        SeoHtml html = new SeoHtml(week ? "Le podium de la semaine · CrackLab" : "Classement CrackLab", description,
                base + "/cracklab/classement" + (week ? "?periode=semaine" : ""))
                .type("website")
                .image(base + "/api/cracklab/share/ranking.png" + (week ? "?period=week" : ""), "Classement CrackLab", CARD_WIDTH, CARD_HEIGHT);
        html.heading(week ? "Le podium de la semaine" : "Classement CrackLab");
        List<SeoHtml.Link> links = new ArrayList<>();
        for (int i = 0; i < rows.size(); i++) {
            SubmissionRepository.RankingRow row = rows.get(i);
            links.add(new SeoHtml.Link(base + "/cracklab/membres/" + row.getUserId(), (i + 1) + ". "
                    + CrackLabMapper.displayName(row.getFirstName(), row.getLastName(), row.getUsername()) + " · " + row.getTotalScore() + " pts"));
        }
        if (!links.isEmpty()) {
            html.links("Les meilleurs", links);
        }
        return ResponseEntity.ok(html.render());
    }

    @GetMapping(value = "/membres/{id}", produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<String> member(@PathVariable Long id, HttpServletRequest request) {
        MemberProgress member = progress.publicProfile(id);
        String base = baseUrl(request);
        String name = CrackLabMapper.displayNameOf(member.member());
        long badges = member.badges().stream().filter(MemberProgress.BadgeState::unlocked).count();
        String description = name + " · niveau " + member.level().name() + " · " + member.xp() + " XP"
                + (member.rank() > 0 ? " · " + member.rank() + (member.rank() == 1 ? "er" : "e") + " du classement" : "")
                + " · " + badges + " badge" + (badges > 1 ? "s" : "") + ". Mesure-toi à ce profil sur CrackLab.";
        SeoHtml html = new SeoHtml(name + " · CrackLab", description, base + "/cracklab/membres/" + id)
                .type("profile")
                .image(base + "/api/cracklab/share/members/" + id + ".png", name, CARD_WIDTH, CARD_HEIGHT);
        html.heading(name);
        html.paragraph(description);
        return ResponseEntity.ok(html.render());
    }

    /** A shared result: the score and how it compares, never the answer itself. */
    @GetMapping(value = "/resultats/{id}", produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<String> result(@PathVariable Long id, HttpServletRequest request) {
        PublicResult result = progress.result(id);
        var submission = result.submission();
        String base = baseUrl(request);
        String name = CrackLabMapper.displayNameOf(submission.getUser());
        String challengeTitle = submission.getChallenge().getTitle();
        boolean graded = submission.getStatus() == SubmissionStatus.GRADED;
        String title = graded
                ? name + " a obtenu " + submission.getTechnicalScore() + "/" + submission.getChallenge().totalPoints() + " sur « " + challengeTitle + " »"
                : name + " a relevé le challenge « " + challengeTitle + " »";
        String standing = graded && result.rankOnChallenge() == 1 ? "Meilleur score du challenge. "
                : graded && result.stats().graded() > 1 ? "Mieux que " + result.betterThanPercent() + " % des participants. " : "";
        String description = standing + "Relève le même défi et compare ton score.";
        SeoHtml html = new SeoHtml(title + " · CrackLab", description, base + "/cracklab/resultats/" + id)
                .type("article")
                .image(base + "/api/cracklab/share/results/" + id + ".png", title, CARD_WIDTH, CARD_HEIGHT);
        html.heading(title);
        html.paragraph(description);
        html.links("Le challenge", List.of(new SeoHtml.Link(base + "/cracklab/challenges/" + submission.getChallenge().getSlug(), challengeTitle)));
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
