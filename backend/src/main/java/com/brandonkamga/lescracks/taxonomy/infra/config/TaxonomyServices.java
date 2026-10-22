package com.brandonkamga.lescracks.taxonomy.infra.config;

import com.brandonkamga.lescracks.taxonomy.application.TaxonomyService;
import com.brandonkamga.lescracks.taxonomy.application.TaxonomyServiceImpl;
import com.brandonkamga.lescracks.taxonomy.domain.port.CategoryStore;
import com.brandonkamga.lescracks.taxonomy.domain.port.TagStore;
import com.brandonkamga.lescracks.shared.config.TransactionalServices;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class TaxonomyServices {

    @Bean
    TaxonomyService taxonomyService(TransactionalServices transactional, CategoryStore categories, TagStore tags) {
        return transactional.wrap(TaxonomyService.class, new TaxonomyServiceImpl(categories, tags));
    }
}
