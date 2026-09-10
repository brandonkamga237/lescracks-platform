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
        Map<String, List<String>> taxonomy = new LinkedHashMap<>();
        taxonomy.put("Développement web", List.of("React", "TypeScript", "Node.js"));
        taxonomy.put("Data & IA", List.of("Python", "SQL", "Machine Learning"));
        taxonomy.put("Design & Produit", List.of("Figma", "UI Design", "UX Research"));
        taxonomy.put("DevOps & Cloud", List.of("Docker", "CI/CD", "Linux"));

        taxonomy.forEach((categoryName, tagNames) -> {
            Category category = categories.findByNameIgnoreCase(categoryName)
                    .orElseGet(() -> categories.save(Category.builder()
                            .name(categoryName)
                            .slug(Slugs.uniqueFrom(categoryName, categories::existsBySlug))
                            .build()));
            tagNames.stream()
                    .filter(tagName -> !tags.existsByNameIgnoreCaseAndCategoryId(tagName, category.getId()))
                    .map(tagName -> Tag.builder().name(tagName).category(category).build())
                    .forEach(tags::save);
        });

        log.info("Production taxonomy ensured: {} categories", taxonomy.size());
    }
}
