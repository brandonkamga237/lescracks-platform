package com.brandonkamga.lescracks.controller;

import com.brandonkamga.lescracks.domain.Event;
import com.brandonkamga.lescracks.domain.Learner;
import com.brandonkamga.lescracks.domain.Resource;
import com.brandonkamga.lescracks.repository.EventRepository;
import com.brandonkamga.lescracks.repository.LearnerRepository;
import com.brandonkamga.lescracks.repository.ResourceRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

/**
 * Server-rendered SEO/GEO snapshots for the SPA's dynamic detail pages.
 *
 * The site is a client-rendered SPA, so crawlers that don't execute JS — notably AI /
 * generative engines — see an empty shell on every internal route. nginx routes known
 * bot user-agents on the public detail paths to these endpoints, which return a minimal
 * but complete HTML document (real title/description/content + schema.org JSON-LD) built
 * from the DB. Humans keep getting the normal SPA; only bots are redirected here.
 */
@RestController
@RequestMapping("/seo")
public class SeoController {

    private static final String SITE = "https://lescracks.com";
    private static final String DEFAULT_IMAGE = SITE + "/og-image.png";
    private static final DateTimeFormatter DATE_FR =
            DateTimeFormatter.ofPattern("d MMMM yyyy", Locale.FRENCH);

    private final EventRepository eventRepository;
    private final ResourceRepository resourceRepository;
    private final LearnerRepository learnerRepository;

    public SeoController(EventRepository eventRepository,
                         ResourceRepository resourceRepository,
                         LearnerRepository learnerRepository) {
        this.eventRepository = eventRepository;
        this.resourceRepository = resourceRepository;
        this.learnerRepository = learnerRepository;
    }

    // ── Events ──────────────────────────────────────────────────────────────────
    @GetMapping(value = "/evenements/{slug}", produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<String> event(@PathVariable String slug) {
        return eventRepository.findBySlug(slug).map(e -> {
            String canonical = SITE + "/evenements/" + e.getSlug();
            String desc = meta(e.getDescription());

            StringBuilder body = new StringBuilder();
            body.append("<h1>").append(esc(e.getTitle())).append("</h1>");
            if (e.getEventDate() != null) {
                body.append("<p><strong>Date :</strong> ").append(esc(e.getEventDate().format(DATE_FR)));
                if (e.getEndDate() != null) body.append(" — ").append(esc(e.getEndDate().format(DATE_FR)));
                body.append("</p>");
            }
            if (notBlank(e.getLocation())) {
                body.append("<p><strong>Lieu :</strong> ").append(esc(e.getLocation())).append("</p>");
            }
            if (notBlank(e.getDescription())) {
                body.append("<div>").append(esc(strip(e.getDescription()))).append("</div>");
            }

            String status = "closed".equalsIgnoreCase(e.deriveStatus().name())
                    ? "https://schema.org/EventCancelled" : "https://schema.org/EventScheduled";
            StringBuilder ld = new StringBuilder();
            ld.append("{\"@context\":\"https://schema.org\",\"@type\":\"Event\",")
              .append("\"name\":\"").append(jesc(e.getTitle())).append("\"");
            if (notBlank(e.getDescription())) ld.append(",\"description\":\"").append(jesc(meta(e.getDescription()))).append("\"");
            if (e.getEventDate() != null) ld.append(",\"startDate\":\"").append(jesc(e.getEventDate().toString())).append("\"");
            if (e.getEndDate() != null) ld.append(",\"endDate\":\"").append(jesc(e.getEndDate().toString())).append("\"");
            if (notBlank(e.getCoverImageUrl())) ld.append(",\"image\":\"").append(jesc(e.getCoverImageUrl())).append("\"");
            ld.append(",\"eventStatus\":\"").append(status).append("\"");
            if (notBlank(e.getLocation())) {
                ld.append(",\"location\":{\"@type\":\"Place\",\"name\":\"").append(jesc(e.getLocation())).append("\"}");
            } else {
                ld.append(",\"eventAttendanceMode\":\"https://schema.org/OnlineEventAttendanceMode\"")
                  .append(",\"location\":{\"@type\":\"VirtualLocation\",\"url\":\"").append(SITE).append("/evenements\"}");
            }
            ld.append(",\"url\":\"").append(canonical).append("\"")
              .append(",\"organizer\":{\"@type\":\"Organization\",\"name\":\"LesCracks\",\"url\":\"").append(SITE).append("\"}}");

            return html(e.getTitle(), desc, canonical, e.getCoverImageUrl(), ld.toString(), body.toString());
        }).orElseGet(() -> notFound("Événement introuvable"));
    }

    // ── Resources ───────────────────────────────────────────────────────────────
    @GetMapping(value = "/ressources/{slug}", produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<String> resource(@PathVariable String slug) {
        return resourceRepository.findBySlug(slug).map(r -> {
            String canonical = SITE + "/ressources/" + r.getSlug();
            String desc = meta(r.getDescription());
            String category = r.getCategory() != null ? r.getCategory().getName() : null;

            StringBuilder body = new StringBuilder();
            body.append("<h1>").append(esc(r.getTitle())).append("</h1>");
            if (notBlank(category)) body.append("<p><strong>Catégorie :</strong> ").append(esc(category)).append("</p>");
            if (notBlank(r.getDescription())) body.append("<div>").append(esc(strip(r.getDescription()))).append("</div>");

            StringBuilder ld = new StringBuilder();
            ld.append("{\"@context\":\"https://schema.org\",\"@type\":\"LearningResource\",")
              .append("\"name\":\"").append(jesc(r.getTitle())).append("\"");
            if (notBlank(r.getDescription())) ld.append(",\"description\":\"").append(jesc(meta(r.getDescription()))).append("\"");
            if (notBlank(category)) ld.append(",\"about\":\"").append(jesc(category)).append("\"");
            ld.append(",\"url\":\"").append(canonical).append("\"")
              .append(",\"inLanguage\":\"fr\"")
              .append(",\"provider\":{\"@type\":\"Organization\",\"name\":\"LesCracks\",\"url\":\"").append(SITE).append("\"}}");

            return html(r.getTitle(), desc, canonical, null, ld.toString(), body.toString());
        }).orElseGet(() -> notFound("Ressource introuvable"));
    }

    // ── Learners ────────────────────────────────────────────────────────────────
    @GetMapping(value = "/apprenants/{slug}", produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<String> learner(@PathVariable String slug) {
        return learnerRepository.findBySlug(slug)
            .filter(Learner::isVisible)
            .map(l -> {
                String name = (safe(l.getFirstName()) + " " + safe(l.getLastName())).trim();
                String canonical = SITE + "/apprenants/" + l.getSlug();
                String desc = meta(l.getBio() != null ? l.getBio()
                        : "Apprenant accompagné par LesCracks" + (notBlank(l.getCohort()) ? " — cohorte " + l.getCohort() : ""));

                StringBuilder body = new StringBuilder();
                body.append("<h1>").append(esc(name)).append("</h1>");
                if (notBlank(l.getCohort())) body.append("<p><strong>Cohorte :</strong> ").append(esc(l.getCohort())).append("</p>");
                if (notBlank(l.getBio())) body.append("<div>").append(esc(strip(l.getBio()))).append("</div>");

                StringBuilder ld = new StringBuilder();
                ld.append("{\"@context\":\"https://schema.org\",\"@type\":\"Person\",")
                  .append("\"name\":\"").append(jesc(name)).append("\"");
                if (notBlank(l.getBio())) ld.append(",\"description\":\"").append(jesc(meta(l.getBio()))).append("\"");
                if (notBlank(l.getPhotoUrl())) ld.append(",\"image\":\"").append(jesc(l.getPhotoUrl())).append("\"");
                if (notBlank(l.getLinkedinUrl())) ld.append(",\"sameAs\":[\"").append(jesc(l.getLinkedinUrl())).append("\"]");
                ld.append(",\"url\":\"").append(canonical).append("\"")
                  .append(",\"alumniOf\":{\"@type\":\"Organization\",\"name\":\"LesCracks\",\"url\":\"").append(SITE).append("\"}}");

                return html(name + " — Apprenant", desc, canonical, l.getPhotoUrl(), ld.toString(), body.toString());
            })
            .orElseGet(() -> notFound("Apprenant introuvable"));
    }

    // ── Static marketing pages ────────────────────────────────────────────────────
    // The SPA renders these client-side, so JS-less crawlers (AI engines especially)
    // see an empty shell. nginx routes bots on /, /about, /programme, /postuler and
    // /open-source here; the content is authored (these pages are hardcoded in React,
    // and the CI build has no backend to prerender against) and kept factual for GEO.

    private static final String ORG_JSONLD =
            "{\"@context\":\"https://schema.org\",\"@type\":\"EducationalOrganization\","
            + "\"name\":\"LesCracks\",\"alternateName\":\"Les Cracks Academy\","
            + "\"url\":\"" + SITE + "\",\"logo\":\"" + SITE + "/images/lescracks-logo.svg\","
            + "\"image\":\"" + DEFAULT_IMAGE + "\","
            + "\"description\":\"Agence edtech d'Afrique francophone : événements, ressources, communauté et open source, plus un programme de mentoring premium (Accompagnement 360) de 6 à 12 mois.\","
            + "\"address\":{\"@type\":\"PostalAddress\",\"addressCountry\":\"CM\",\"addressLocality\":\"Yaoundé\"},"
            + "\"areaServed\":[\"CM\",\"CI\",\"SN\",\"FR\",\"BE\"],\"knowsLanguage\":\"fr\","
            + "\"sameAs\":[\"https://www.linkedin.com/company/lescracks\",\"https://twitter.com/lescracks\",\"https://instagram.com/lescracks\"],"
            + "\"founder\":{\"@type\":\"Person\",\"name\":\"Brandon Kamga\"}}";

    @GetMapping(value = "/pages/{page}", produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<String> page(@PathVariable String page) {
        switch (page) {
            case "home": return home();
            case "about": return about();
            case "programme": return programme();
            case "postuler": return postuler();
            case "open-source": return openSource();
            default: return notFound("Page introuvable");
        }
    }

    private ResponseEntity<String> home() {
        String body = "<h1>LesCracks — accompagnement tech en Afrique francophone</h1>"
                + "<p>LesCracks (Les Cracks Academy) est une agence edtech basée à Yaoundé, au Cameroun, qui aide les"
                + " jeunes passionnés de tech à passer du niveau débutant à un profil employable. Son activité s'articule"
                + " autour d'<strong>événements</strong> (workshops, bootcamps), de <strong>ressources pédagogiques</strong>,"
                + " d'une <strong>communauté d'apprenants</strong> et de <strong>projets open source</strong>.</p>"
                + "<p>Pour aller plus loin, LesCracks propose l'<strong>Accompagnement 360</strong> : un programme de"
                + " mentoring en ligne de 6 à 12 mois avec mentor dédié, projets concrets et attestation de complétion.</p>"
                + "<ul><li>Zones servies : Cameroun, Côte d'Ivoire, Sénégal, France, Belgique.</li>"
                + "<li>Langue : français. Fondateur : Brandon Kamga.</li></ul>";
        return html("LesCracks — accompagnement tech en Afrique francophone",
                "Agence edtech d'Afrique francophone : événements, ressources, communauté et open source, plus l'Accompagnement 360, un mentoring de 6 à 12 mois.",
                SITE + "/", null, ORG_JSONLD, body);
    }

    private ResponseEntity<String> about() {
        String body = "<h1>À propos de LesCracks</h1>"
                + "<p>LesCracks est une agence edtech d'Afrique francophone dont la mission est d'accompagner les jeunes"
                + " passionnés de tech jusqu'à un profil employable, par un suivi humain, des projets réels et une communauté.</p>"
                + "<p>Fondée par <strong>Brandon Kamga</strong>, basée à Yaoundé (Cameroun), LesCracks sert principalement"
                + " le Cameroun, la Côte d'Ivoire, le Sénégal, ainsi que la France et la Belgique. Le contenu est en français.</p>";
        return html("À propos — LesCracks",
                "L'histoire, la mission et les valeurs de LesCracks, agence edtech d'Afrique francophone fondée par Brandon Kamga, basée à Yaoundé.",
                SITE + "/about", null, ORG_JSONLD, body);
    }

    private ResponseEntity<String> programme() {
        String body = "<h1>Accompagnement 360 — le programme</h1>"
                + "<p>L'Accompagnement 360 est le programme de mentoring premium de LesCracks : un suivi humain et structuré"
                + " de <strong>6 à 12 mois</strong> pour passer de débutant à profil employable, entièrement en ligne.</p>"
                + "<p><strong>Ce que tu obtiens :</strong> bilan de profil, plan de progression personnalisé, mentor dédié,"
                + " projets réels, accès aux ressources et à la communauté, préparation à l'insertion (emploi, freelance ou"
                + " projet) et attestation de complétion.</p>"
                + "<p><strong>Comment ça marche :</strong> candidature → bilan initial (45 min) → plan personnalisé →"
                + " accompagnement actif (6 à 12 mois) → mise en situation.</p>";
        String ld = "{\"@context\":\"https://schema.org\",\"@type\":\"EducationalOccupationalProgram\","
                + "\"name\":\"Accompagnement 360\","
                + "\"description\":\"Programme de mentoring en ligne de 6 à 12 mois avec mentor dédié, projets réels et attestation de complétion.\","
                + "\"provider\":{\"@type\":\"EducationalOrganization\",\"name\":\"LesCracks\",\"url\":\"" + SITE + "\"},"
                + "\"timeToComplete\":\"P6M\",\"programType\":\"Mentoring\",\"educationalProgramMode\":\"online\","
                + "\"url\":\"" + SITE + "/programme\"}";
        return html("Accompagnement 360 — le programme | LesCracks",
                "Le programme de mentoring premium de LesCracks : suivi de 6 à 12 mois, mentor dédié, projets réels, attestation. Pour qui, comment ça marche.",
                SITE + "/programme", null, ld, body);
    }

    private ResponseEntity<String> postuler() {
        String body = "<h1>Postuler à l'Accompagnement 360</h1>"
                + "<p>Rejoins l'Accompagnement 360 de LesCracks : un suivi personnalisé de 6 à 12 mois avec mentor dédié,"
                + " projets réels et attestation. La candidature se fait en ligne — l'équipe étudie ton profil et te répond,"
                + " puis un bilan initial permet de définir ta trajectoire.</p>";
        String ld = "{\"@context\":\"https://schema.org\",\"@type\":\"WebPage\","
                + "\"name\":\"Postuler à l'Accompagnement 360\",\"url\":\"" + SITE + "/postuler\","
                + "\"about\":{\"@type\":\"EducationalOccupationalProgram\",\"name\":\"Accompagnement 360\","
                + "\"provider\":{\"@type\":\"EducationalOrganization\",\"name\":\"LesCracks\"}}}";
        return html("Postuler à l'Accompagnement 360 — LesCracks",
                "Candidature à l'Accompagnement 360 de LesCracks : suivi de 6 à 12 mois avec mentor dédié, projets réels et attestation.",
                SITE + "/postuler", null, ld, body);
    }

    private ResponseEntity<String> openSource() {
        String body = "<h1>Projets open source LesCracks</h1>"
                + "<p>LesCracks construit en open source et contribue à l'écosystème tech africain : outils, librairies et"
                + " projets ouverts à tous, portés par la communauté. La page présente les projets maintenus par LesCracks"
                + " et les contributeurs reconnus.</p>";
        String ld = "{\"@context\":\"https://schema.org\",\"@type\":\"CollectionPage\","
                + "\"name\":\"Projets open source LesCracks\",\"url\":\"" + SITE + "/open-source\","
                + "\"isPartOf\":{\"@type\":\"EducationalOrganization\",\"name\":\"LesCracks\",\"url\":\"" + SITE + "\"}}";
        return html("Projets open source — LesCracks",
                "LesCracks construit en open source pour l'écosystème tech africain : projets, librairies et contributeurs de la communauté.",
                SITE + "/open-source", null, ld, body);
    }

    // ── HTML assembly ─────────────────────────────────────────────────────────────
    private static ResponseEntity<String> html(String title, String metaDesc, String canonical,
                                                String image, String jsonLd, String bodyInner) {
        String img = notBlank(image) ? image : DEFAULT_IMAGE;
        String doc = "<!doctype html>\n<html lang=\"fr\"><head>"
                + "<meta charset=\"utf-8\">"
                + "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">"
                + "<title>" + esc(title) + " — LesCracks</title>"
                + "<meta name=\"description\" content=\"" + esc(metaDesc) + "\">"
                + "<link rel=\"canonical\" href=\"" + esc(canonical) + "\">"
                + "<meta property=\"og:type\" content=\"article\">"
                + "<meta property=\"og:site_name\" content=\"LesCracks\">"
                + "<meta property=\"og:title\" content=\"" + esc(title) + " — LesCracks\">"
                + "<meta property=\"og:description\" content=\"" + esc(metaDesc) + "\">"
                + "<meta property=\"og:url\" content=\"" + esc(canonical) + "\">"
                + "<meta property=\"og:image\" content=\"" + esc(img) + "\">"
                + "<meta name=\"twitter:card\" content=\"summary_large_image\">"
                + "<script type=\"application/ld+json\">" + jsonLd + "</script>"
                + "</head><body><main>" + bodyInner
                + "<p><a href=\"" + esc(canonical) + "\">Voir la page complète sur LesCracks</a></p>"
                + "</main></body></html>";
        return ResponseEntity.ok().contentType(MediaType.valueOf("text/html;charset=UTF-8")).body(doc);
    }

    private static ResponseEntity<String> notFound(String label) {
        String doc = "<!doctype html>\n<html lang=\"fr\"><head><meta charset=\"utf-8\">"
                + "<title>" + esc(label) + " — LesCracks</title>"
                + "<meta name=\"robots\" content=\"noindex\"></head>"
                + "<body><main><h1>" + esc(label) + "</h1>"
                + "<p><a href=\"" + SITE + "\">Retour à l'accueil LesCracks</a></p></main></body></html>";
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .contentType(MediaType.valueOf("text/html;charset=UTF-8")).body(doc);
    }

    // ── Helpers ────────────────────────────────────────────────────────────────────
    private static boolean notBlank(String s) { return s != null && !s.isBlank(); }
    private static String safe(String s) { return s == null ? "" : s; }

    /** Strip tags/whitespace and clip to a meta-description length. */
    private static String meta(String s) {
        if (s == null) return "";
        String t = strip(s);
        return t.length() > 160 ? t.substring(0, 157) + "…" : t;
    }

    private static String strip(String s) {
        return s == null ? "" : s.replaceAll("<[^>]+>", " ").replaceAll("\\s+", " ").trim();
    }

    private static String esc(String s) {
        if (s == null) return "";
        return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
                .replace("\"", "&quot;").replace("'", "&#39;");
    }

    private static String jesc(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\").replace("\"", "\\\"")
                .replace("\n", " ").replace("\r", " ").replace("\t", " ");
    }
}
