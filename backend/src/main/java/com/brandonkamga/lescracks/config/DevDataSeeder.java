package com.brandonkamga.lescracks.config;

import com.brandonkamga.lescracks.domain.Admin;
import com.brandonkamga.lescracks.domain.AdminStatus;
import com.brandonkamga.lescracks.domain.Category;
import com.brandonkamga.lescracks.domain.Tag;
import com.brandonkamga.lescracks.repository.AdminRepository;
import com.brandonkamga.lescracks.repository.CategoryRepository;
import com.brandonkamga.lescracks.repository.TagRepository;
import com.brandonkamga.lescracks.util.Slugs;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Development seed data: a default admin plus the taxonomy, so a fresh clone is usable
 * on first boot. Runs only under the `dev` profile and only inserts what is missing.
 */
@Component
@Profile("dev")
public class DevDataSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DevDataSeeder.class);

    private final AdminRepository admins;
    private final CategoryRepository categories;
    private final TagRepository tags;
    private final PasswordEncoder passwords;
    private final String username;
    private final String password;

    public DevDataSeeder(AdminRepository admins, CategoryRepository categories, TagRepository tags,
                         PasswordEncoder passwords,
                         @Value("${app.admin.bootstrap-username:admin}") String username,
                         @Value("${app.admin.bootstrap-password:admin}") String password) {
        this.admins = admins;
        this.categories = categories;
        this.tags = tags;
        this.passwords = passwords;
        this.username = username;
        this.password = password;
    }

    @Override
    @Transactional
    public void run(String... args) {
        seedAdmin();
        seedTaxonomy();
    }

    private void seedAdmin() {
        if (admins.findByUsernameIgnoreCase(username).isPresent()) {
            return;
        }
        admins.save(Admin.builder()
                .username(username)
                .passwordHash(passwords.encode(password))
                .status(AdminStatus.ACTIVE)
                .build());
        log.info("Seeded default admin '{}'", username);
    }

    private void seedTaxonomy() {
        Map<String, List<String>> taxonomy = new LinkedHashMap<>();
        taxonomy.put("Développement web", List.of("JavaScript", "React", "TypeScript", "HTML & CSS", "Node.js"));
        taxonomy.put("Data & IA", List.of("Python", "SQL", "Machine Learning", "Analyse de données"));
        taxonomy.put("Design & Produit", List.of("UI Design", "UX Research", "Figma"));
        taxonomy.put("Carrière", List.of("CV & LinkedIn", "Entretien technique", "Freelance"));
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
        log.info("Taxonomy seeded: {} categories", taxonomy.size());
    }
}
