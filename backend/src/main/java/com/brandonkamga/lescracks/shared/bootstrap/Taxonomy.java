package com.brandonkamga.lescracks.shared.bootstrap;

import com.brandonkamga.lescracks.taxonomy.domain.Category;
import com.brandonkamga.lescracks.taxonomy.infra.CategoryRepository;

import java.util.List;

/**
 * The nine themes of the blog and of member interests, shared by the demo and production seeders
 * so the two environments cannot drift apart. Tags are not seeded: they are the words an
 * author puts on an article, created as articles are written.
 */
final class Taxonomy {

    record Theme(String name, String slug, String description) {
    }

    static final List<Theme> THEMES = List.of(
            new Theme("Développement web", "developpement-web", "Sites et applications web, du navigateur au serveur qui les sert."),
            new Theme("Backend & bases de données", "backend-bases-de-donnees", "Les services, les API et les données qui font tourner une application."),
            new Theme("Mobile", "mobile", "Applications Android, iOS et multiplateformes."),
            new Theme("Data & IA", "data-ia", "Données, apprentissage automatique et intelligence artificielle."),
            new Theme("DevOps & Cloud", "devops-cloud", "Livrer, déployer et faire tourner un logiciel en production."),
            new Theme("Cybersécurité", "cybersecurite", "Protéger les systèmes, les données et les identités."),
            new Theme("Architecture & qualité", "architecture-qualite", "Concevoir un logiciel qui tient dans le temps : architecture, patterns, tests et performance."),
            new Theme("Fondamentaux & langages", "fondamentaux-langages", "Algorithmique, langages et fonctionnement de la machine."),
            new Theme("Carrière tech", "carriere-tech", "Trouver sa place, progresser et travailler avec les autres."));

    private Taxonomy() {
    }

    /** Creates the themes that are missing; one an admin renamed or added is left as it is. */
    static int ensureThemes(CategoryRepository categories) {
        int created = 0;
        for (Theme theme : THEMES) {
            if (categories.existsByNameIgnoreCase(theme.name()) || categories.existsBySlug(theme.slug())) continue;
            categories.save(Category.builder().name(theme.name()).slug(theme.slug()).description(theme.description()).build());
            created++;
        }
        return created;
    }
}
