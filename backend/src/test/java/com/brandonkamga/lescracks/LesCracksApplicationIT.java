package com.brandonkamga.lescracks;

import com.brandonkamga.lescracks.event.domain.EventService;
import com.brandonkamga.lescracks.identity.domain.AdminAuthService;
import com.brandonkamga.lescracks.identity.domain.UserAuthService;
import com.brandonkamga.lescracks.mail.domain.MailService;
import com.brandonkamga.lescracks.newsletter.domain.NewsletterService;
import com.brandonkamga.lescracks.resource.domain.ResourceService;
import com.brandonkamga.lescracks.stats.domain.StatsService;
import com.brandonkamga.lescracks.storage.domain.StorageService;
import com.brandonkamga.lescracks.support.PostgresIT;
import com.brandonkamga.lescracks.taxonomy.domain.TaxonomyService;

import jakarta.persistence.EntityManagerFactory;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.ApplicationContext;
import org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerMapping;

import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * The smoke test for the whole application: the context starts against a real database.
 *
 * It is worth more than it looks. Starting the context is what proves the component scan still
 * reaches every domain package, that Hibernate's {@code validate} agrees with the migrations,
 * and that the Spring Data repositories are still found where they now live. A package moved
 * to the wrong place fails here, and nowhere else.
 */
class LesCracksApplicationIT extends PostgresIT {

    @Autowired private ApplicationContext context;
    @Autowired private EntityManagerFactory entityManagerFactory;

    /** Qualified by name: springdoc contributes handler mappings of its own. */
    @Autowired
    @Qualifier("requestMappingHandlerMapping")
    private RequestMappingHandlerMapping mappings;

    @Test
    @DisplayName("every domain contributes exactly one implementation of its service")
    void everyDomainServiceIsWired() {
        Stream.of(ResourceService.class, TaxonomyService.class, EventService.class,
                        NewsletterService.class, StatsService.class, StorageService.class,
                        MailService.class, UserAuthService.class, AdminAuthService.class)
                .forEach(service -> assertThat(context.getBeansOfType(service))
                        .as("%s implementations", service.getSimpleName())
                        .hasSize(1));
    }

    @ParameterizedTest
    @ValueSource(strings = {
            "/api/resources", "/api/events", "/api/categories", "/api/tags",
            "/api/newsletter/subscribe", "/api/files/{key}", "/api/me", "/api/auth/login",
            "/api/admin/stats/overview", "/api/admin/users", "/seo/pages/{page}",
            "/api/sitemap.xml"
    })
    @DisplayName("the routes of every domain are still mapped after the packages moved")
    void routesAreMapped(String route) {
        Set<String> patterns = mappings.getHandlerMethods().keySet().stream()
                .filter(info -> info.getPathPatternsCondition() != null)
                .flatMap(info -> info.getPathPatternsCondition().getPatternValues().stream())
                .collect(Collectors.toSet());

        assertThat(patterns).contains(route);
    }

    @Test
    @DisplayName("the entities of every domain are part of the persistence unit")
    void entitiesFromEveryDomainAreScanned() {
        Set<String> entities = entityManagerFactory.getMetamodel().getEntities().stream()
                .map(type -> type.getJavaType().getSimpleName())
                .collect(Collectors.toSet());

        assertThat(entities).contains("Resource", "Ebook", "Article", "ExternalVideoReference",
                "Category", "Tag", "Event", "NewsletterSubscription", "User", "Admin");
    }
}
