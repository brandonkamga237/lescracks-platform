package com.brandonkamga.lescracks.shared.bootstrap;

import com.brandonkamga.lescracks.taxonomy.application.TaxonomyService;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

@Component
@Profile("prod")
public class ProductionDataSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(ProductionDataSeeder.class);

    private final TaxonomyService taxonomy;

    public ProductionDataSeeder(TaxonomyService taxonomy) {
        this.taxonomy = taxonomy;
    }

    @Override
    public void run(String... args) {
        int created = taxonomy.ensureCategories(Taxonomy.THEMES);
        if (created > 0) log.info("Production themes created: {}", created);
    }
}
