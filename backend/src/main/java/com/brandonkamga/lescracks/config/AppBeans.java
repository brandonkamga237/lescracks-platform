package com.brandonkamga.lescracks.config;

import com.brandonkamga.lescracks.util.ArticleBody;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Beans for the few collaborators that are plain classes.
 *
 * {@link ArticleBody} is deliberately not annotated: it is a pure function over JSON with no
 * Spring in it, which is what makes it testable without a context.
 */
@Configuration
public class AppBeans {

    @Bean
    ArticleBody articleBody(ObjectMapper mapper) {
        return new ArticleBody(mapper);
    }
}
