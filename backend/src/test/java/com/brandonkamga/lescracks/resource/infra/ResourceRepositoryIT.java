package com.brandonkamga.lescracks.resource.infra;

import com.brandonkamga.lescracks.resource.domain.Resource;
import com.brandonkamga.lescracks.resource.domain.ResourceStatus;
import com.brandonkamga.lescracks.support.PostgresIT;
import com.brandonkamga.lescracks.taxonomy.domain.Category;
import com.brandonkamga.lescracks.taxonomy.domain.Tag;
import com.brandonkamga.lescracks.taxonomy.infra.CategoryRepository;
import com.brandonkamga.lescracks.taxonomy.infra.TagRepository;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

import static com.brandonkamga.lescracks.resource.domain.ResourceFixtures.category;
import static com.brandonkamga.lescracks.resource.domain.ResourceFixtures.resource;
import static com.brandonkamga.lescracks.resource.domain.ResourceFixtures.tag;
import static org.assertj.core.api.Assertions.assertThat;

/**
 * The catalogue query, against real PostgreSQL.
 *
 * {@code search} is one JPQL statement with five optional filters and three correlated
 * subqueries, including a {@code cast(:search as string)} that exists only to satisfy the real
 * dialect. Nothing but a real database says whether it works, which is why this is an
 * {@code *IT} and not a mocked test.
 *
 * Isolation comes from the rollback: {@code @Transactional} on the class, so the rows written
 * here never reach the next test class.
 */
@Transactional
class ResourceRepositoryIT extends PostgresIT {

    @Autowired private ResourceRepository resources;
    @Autowired private CategoryRepository categories;
    @Autowired private TagRepository tags;

    private static final PageRequest FIRST_PAGE = PageRequest.of(0, 10);

    private Category backend;
    private Category frontend;
    private Tag java;

    @BeforeEach
    void seed() {
        backend = categories.save(category("Backend"));
        frontend = categories.save(category("Frontend"));
        java = tags.save(tag(backend, "Java"));
    }

    private Resource save(Category category, String title, ResourceStatus status) {
        return resources.saveAndFlush(resource(category, title, status));
    }

    @Test
    void findsBySlugAndReportsWhetherItIsTaken() {
        save(backend, "Spring Boot", ResourceStatus.PUBLISHED);

        assertThat(resources.findBySlug("spring-boot")).isPresent();
        assertThat(resources.existsBySlug("spring-boot")).isTrue();
        assertThat(resources.existsBySlug("spring-boot-2")).isFalse();
    }

    @Test
    @DisplayName("the public listing never leaks a draft")
    void filtersByStatus() {
        save(backend, "Publiee", ResourceStatus.PUBLISHED);
        save(backend, "Brouillon", ResourceStatus.DRAFT);

        var published = resources.search(ResourceStatus.PUBLISHED, null, null, null, FIRST_PAGE);

        assertThat(published.getContent()).extracting(Resource::getTitle).containsExactly("Publiee");
    }

    @Test
    @DisplayName("a null status means every status, so the back office sees drafts too")
    void aNullStatusMatchesEverything() {
        save(backend, "Publiee", ResourceStatus.PUBLISHED);
        save(backend, "Brouillon", ResourceStatus.DRAFT);

        assertThat(resources.search(null, null, null, null, FIRST_PAGE)).hasSize(2);
    }

    @Test
    @DisplayName("the title search is case-insensitive and matches a fragment")
    void searchesTitlesCaseInsensitively() {
        save(backend, "Spring Boot avance", ResourceStatus.PUBLISHED);
        save(backend, "React pour les nuls", ResourceStatus.PUBLISHED);

        var hits = resources.search(null, "SPRING", null, null, FIRST_PAGE);

        assertThat(hits.getContent()).extracting(Resource::getTitle).containsExactly("Spring Boot avance");
    }

    @Test
    void filtersByCategory() {
        save(backend, "Cote serveur", ResourceStatus.PUBLISHED);
        save(frontend, "Cote client", ResourceStatus.PUBLISHED);

        var hits = resources.search(null, null, frontend.getId(), null, FIRST_PAGE);

        assertThat(hits.getContent()).extracting(Resource::getTitle).containsExactly("Cote client");
    }

    @Test
    void filtersByTag() {
        Resource tagged = resource(backend, "Avec tag", ResourceStatus.PUBLISHED);
        tagged.getTags().add(java);
        resources.saveAndFlush(tagged);
        save(backend, "Sans tag", ResourceStatus.PUBLISHED);

        var hits = resources.search(null, null, null, java.getId(), FIRST_PAGE);

        assertThat(hits.getContent()).extracting(Resource::getTitle).containsExactly("Avec tag");
    }

    @Test
    @DisplayName("the newest resource comes first")
    void ordersByCreationDateDescending() {
        Resource older = resource(backend, "Ancienne", ResourceStatus.PUBLISHED);
        older.setCreatedAt(Instant.now().minus(2, ChronoUnit.DAYS));
        resources.saveAndFlush(older);
        Resource newer = resource(backend, "Recente", ResourceStatus.PUBLISHED);
        newer.setCreatedAt(Instant.now());
        resources.saveAndFlush(newer);

        var published = resources.findByStatusOrderByCreatedAtDesc(ResourceStatus.PUBLISHED);

        assertThat(published).extracting(Resource::getTitle).containsExactly("Recente", "Ancienne");
    }
}
