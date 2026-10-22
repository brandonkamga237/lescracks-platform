package com.brandonkamga.lescracks.shared.bootstrap;

import com.brandonkamga.lescracks.taxonomy.domain.model.Category;

import java.util.List;

/**
 * The nine themes of the blog and of member interests, shared by the demo and production seeders
 * so the two environments cannot drift apart. Tags are not seeded: they are the words an
 * author puts on an article, created as articles are written.
 */
final class Taxonomy {

    static final List<Category> THEMES = List.of(
            theme("Développement web", "developpement-web", "Sites et applications web, du navigateur au serveur qui les sert."),
            theme("Backend & bases de données", "backend-bases-de-donnees", "Les services, les API et les données qui font tourner une application."),
            theme("Mobile", "mobile", "Applications Android, iOS et multiplateformes."),
            theme("Data & IA", "data-ia", "Données, apprentissage automatique et intelligence artificielle."),
            theme("DevOps & Cloud", "devops-cloud", "Livrer, déployer et faire tourner un logiciel en production."),
            theme("Cybersécurité", "cybersecurite", "Protéger les systèmes, les données et les identités."),
            theme("Architecture & qualité", "architecture-qualite", "Concevoir un logiciel qui tient dans le temps : architecture, patterns, tests et performance."),
            theme("Fondamentaux & langages", "fondamentaux-langages", "Algorithmique, langages et fonctionnement de la machine."),
            theme("Carrière tech", "carriere-tech", "Trouver sa place, progresser et travailler avec les autres."));

    private Taxonomy() {
    }

    private static Category theme(String name, String slug, String description) {
        return Category.builder().name(name).slug(slug).description(description).build();
    }
}
