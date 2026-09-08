package com.brandonkamga.lescracks.config;

import com.brandonkamga.lescracks.domain.Category;
import com.brandonkamga.lescracks.domain.Tag;
import com.brandonkamga.lescracks.repository.CategoryRepository;
import com.brandonkamga.lescracks.repository.TagRepository;
import com.brandonkamga.lescracks.util.Slugs;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Component
@Profile("prod")
public class ProductionDataSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(ProductionDataSeeder.class);

    private final CategoryRepository categories;
    private final TagRepository tags;

    public ProductionDataSeeder(CategoryRepository categories, TagRepository tags) {
        this.categories = categories;
        this.tags = tags;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (categories.count() > 0) {
            log.info("Categories already present, skipping production seed.");
            return;
        }

        Map<String, List<String>> taxonomy = new LinkedHashMap<>();
        taxonomy.put("Développement web", List.of(
                "JavaScript", "TypeScript", "React", "Next.js", "HTML & CSS", "Node.js",
                "Performance web", "Accessibilité", "SEO technique", "API REST", "GraphQL"));
        taxonomy.put("Mobile", List.of(
                "React Native", "Flutter", "iOS", "Android", "Progressive Web App",
                "Mobile first", "Notifications push"));
        taxonomy.put("Data & IA", List.of(
                "Python", "SQL", "Machine Learning", "Deep Learning", "Analyse de données",
                "Data visualisation", "Big Data", "NLP"));
        taxonomy.put("DevOps & Cloud", List.of(
                "Docker", "Kubernetes", "CI/CD", "Linux", "AWS", "Azure", "GCP",
                "Terraform", "Monitoring", "Observabilité"));
        taxonomy.put("Cybersécurité", List.of(
                "Pentest", "Cryptographie", "Sécurité web", "RGPD", "Gestion des accès",
                "Threat intelligence", "Forensics"));
        taxonomy.put("Architecture & Conception", List.of(
                "Clean Code", "Architecture hexagonale", "DDD", "Microservices", "Clean Architecture",
                "Patterns de conception", "Tests"));
        taxonomy.put("Bases de données", List.of(
                "PostgreSQL", "MySQL", "MongoDB", "Redis", "Modélisation", "Indexation",
                "Migrations", "Optimisation"));
        taxonomy.put("Carrière tech", List.of(
                "CV & LinkedIn", "Entretien technique", "Freelance", "Négociation",
                "Leadership technique", "Productivité", "Veille"));
        taxonomy.put("Design & Produit", List.of(
                "UI Design", "UX Research", "Figma", "Design system", "Wireframing",
                "Prototypage", "Accessibilité design"));
        taxonomy.put("Outils & Méthodo", List.of(
                "Git", "GitHub", "VS Code", "Agile", "Scrum", "Kanban", "Documentation",
                "Pair programming"));

        taxonomy.forEach((categoryName, tagNames) -> {
            Category category = categories.save(Category.builder()
                    .name(categoryName)
                    .slug(Slugs.uniqueFrom(categoryName, categories::existsBySlug))
                    .build());
            tagNames.stream()
                    .filter(tagName -> !tags.existsByNameIgnoreCaseAndCategoryId(tagName, category.getId()))
                    .map(tagName -> Tag.builder().name(tagName).category(category).build())
                    .forEach(tags::save);
        });

        log.info("Production taxonomy seeded: {} categories, {} tags", taxonomy.size(),
                taxonomy.values().stream().mapToLong(List::size).sum());
    }
}
