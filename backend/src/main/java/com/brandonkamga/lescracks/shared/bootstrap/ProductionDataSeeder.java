package com.brandonkamga.lescracks.shared.bootstrap;

import com.brandonkamga.lescracks.taxonomy.infra.CategoryRepository;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;


@Component
@Profile("prod")
public class ProductionDataSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(ProductionDataSeeder.class);

    private final CategoryRepository categories;

    public ProductionDataSeeder(CategoryRepository categories) {
        this.categories = categories;
    }

    @Override
    @Transactional
    public void run(String... args) {
        int created = Taxonomy.ensureThemes(categories);
        if (created > 0) log.info("Production themes created: {}", created);
    }
}
