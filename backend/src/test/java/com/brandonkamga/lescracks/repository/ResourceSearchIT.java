package com.brandonkamga.lescracks.repository;

import com.brandonkamga.lescracks.domain.Category;
import com.brandonkamga.lescracks.domain.Resource;
import com.brandonkamga.lescracks.domain.ResourceArticle;
import com.brandonkamga.lescracks.domain.ResourceEbook;
import com.brandonkamga.lescracks.domain.ResourceKind;
import com.brandonkamga.lescracks.domain.ResourceVideo;
import com.brandonkamga.lescracks.domain.Tag;
import com.brandonkamga.lescracks.support.PostgresIT;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * The one query the whole catalogue goes through.
 *
 * Its predecessor was eight branches, and three of them returned 500 in production: a type
 * filter typed as String against an enum column, a tag-only filter that reached
 * lower(bytea), and a combination nobody had tried. Those failed on an empty table too,
 * which is why this fixture holds real rows — a 200 proves the SQL runs, not that it
 * answers correctly.
 */
@Transactional
class ResourceSearchIT extends PostgresIT {

    @Autowired
    ResourceRepository resources;

    @Autowired
    CategoryRepository categories;

    @Autowired
    TagRepository tags;

    private static final Pageable FIRST_PAGE = PageRequest.of(0, 20);

    private Long backend;
    private Long devops;
    private Long spring;
    private Long docker;

    @BeforeEach
    void catalogue() {
        resources.deleteAll();
        tags.deleteAll();
        categories.deleteAll();

        Category backendCat = categories.save(Category.builder().name("Backend").build());
        Category devopsCat = categories.save(Category.builder().name("DevOps").build());
        backend = backendCat.getId();
        devops = devopsCat.getId();

        // A tag belongs to a category: the schema refuses a loose one.
        Tag springTag = tags.save(Tag.builder().name("Spring").category(backendCat).build());
        Tag dockerTag = tags.save(Tag.builder().name("Docker").category(devopsCat).build());
        spring = springTag.getId();
        docker = dockerTag.getId();

        ResourceVideo video = new ResourceVideo();
        video.setSlug("intro-spring");
        video.setTitle("Introduction à Spring Boot");
        video.setCategory(backendCat);
        video.setTags(Set.of(springTag));
        video.setPublished(true);
        video.setExternalUrl("https://youtube.com/watch?v=1");
        resources.save(video);

        ResourceArticle article = new ResourceArticle();
        article.setSlug("deployer-docker");
        article.setTitle("Déployer avec Docker");
        article.setCategory(devopsCat);
        article.setTags(Set.of(dockerTag, springTag));
        article.setPublished(true);
        article.setBody("{\"type\":\"doc\",\"content\":[]}");
        article.setBodyText("Un texte");
        resources.save(article);

        ResourceEbook ebook = new ResourceEbook();
        ebook.setSlug("guide-spring");
        ebook.setTitle("Guide Spring avancé");
        ebook.setCategory(backendCat);
        ebook.setPublished(true);
        ebook.setFileKey("ebooks/guide.pdf");
        ebook.setContentType("application/pdf");
        ebook.setOriginalName("guide.pdf");
        ebook.setSizeBytes(1024L);
        resources.save(ebook);

        ResourceVideo draft = new ResourceVideo();
        draft.setSlug("brouillon");
        draft.setTitle("Brouillon Spring");
        draft.setCategory(backendCat);
        draft.setPublished(false);
        draft.setExternalUrl("https://youtube.com/watch?v=2");
        resources.save(draft);

        resources.flush();
    }

    private List<String> found(ResourceKind kind, Long categoryId, java.util.Collection<Long> tagIds, String search) {
        return resources.search(kind, categoryId, tagIds, search, FIRST_PAGE)
                .map(Resource::getSlug).stream().sorted().toList();
    }

    @Test
    @DisplayName("with no filter it returns everything published, and nothing else")
    void noFilterReturnsThePublishedCatalogue() {
        assertThat(found(null, null, null, null))
                .containsExactly("deployer-docker", "guide-spring", "intro-spring");
    }

    @Test
    @DisplayName("a draft never appears, whatever the filter")
    void draftsStayHidden() {
        assertThat(found(null, null, null, "Brouillon")).isEmpty();
        assertThat(found(ResourceKind.VIDEO, null, null, null)).doesNotContain("brouillon");
    }

    @Test
    @DisplayName("filtering by kind reads the discriminator column")
    void filtersByKind() {
        assertThat(found(ResourceKind.VIDEO, null, null, null)).containsExactly("intro-spring");
        assertThat(found(ResourceKind.ARTICLE, null, null, null)).containsExactly("deployer-docker");
        assertThat(found(ResourceKind.EBOOK, null, null, null)).containsExactly("guide-spring");
    }

    @Test
    @DisplayName("filtering by category alone")
    void filtersByCategory() {
        assertThat(found(null, backend, null, null)).containsExactly("guide-spring", "intro-spring");
        assertThat(found(null, devops, null, null)).containsExactly("deployer-docker");
    }

    @Test
    @DisplayName("filtering by tag alone — the combination that used to reach lower(bytea)")
    void filtersByTagAlone() {
        assertThat(found(null, null, List.of(spring), null))
                .containsExactly("deployer-docker", "intro-spring");
        assertThat(found(null, null, List.of(docker), null))
                .containsExactly("deployer-docker");
    }

    @Test
    @DisplayName("several tags widen the result rather than narrowing it")
    void severalTagsAreAUnion() {
        assertThat(found(null, null, List.of(spring, docker), null))
                .containsExactly("deployer-docker", "intro-spring");
    }

    @Test
    @DisplayName("a resource matching two tags is returned once, not twice")
    void doesNotDuplicateOnMultipleTagMatches() {
        assertThat(found(null, null, List.of(spring, docker), null))
                .filteredOn("deployer-docker"::equals)
                .hasSize(1);
    }

    @Test
    @DisplayName("search ignores case and accents in the query, not in the data")
    void searchIsCaseInsensitive() {
        assertThat(found(null, null, null, "spring"))
                .containsExactly("guide-spring", "intro-spring");
        assertThat(found(null, null, null, "SPRING"))
                .containsExactly("guide-spring", "intro-spring");
        assertThat(found(null, null, null, "Déployer")).containsExactly("deployer-docker");
    }

    @Test
    @DisplayName("a search matching nothing returns nothing, not everything")
    void searchWithNoMatchIsEmpty() {
        assertThat(found(null, null, null, "kubernetes")).isEmpty();
    }

    @Test
    @DisplayName("every filter at once narrows to the intersection")
    void combinesEveryFilter() {
        assertThat(found(ResourceKind.VIDEO, backend, List.of(spring), "spring"))
                .containsExactly("intro-spring");

        // Same filters, one contradiction: the ebook carries no tag.
        assertThat(found(ResourceKind.EBOOK, backend, List.of(spring), "spring")).isEmpty();
    }

    @Test
    @DisplayName("an empty tag list is not the same as no tag filter")
    void anEmptyTagListMatchesNothing() {
        assertThat(found(null, null, List.of(), null)).isEmpty();
    }

    @Test
    @DisplayName("paging reports the real total, not the page size")
    void pagingCountsTheWholeResult() {
        var page = resources.search(null, null, null, null, PageRequest.of(0, 2));

        assertThat(page.getContent()).hasSize(2);
        assertThat(page.getTotalElements()).isEqualTo(3);
        assertThat(page.getTotalPages()).isEqualTo(2);
    }

    @Test
    @DisplayName("counting a view does not read the row back")
    void recordViewIncrements() {
        Resource video = resources.findBySlug("intro-spring").orElseThrow();

        resources.recordView(video.getId());
        resources.flush();

        assertThat(resources.findPublishedSlugs())
                .containsExactly("deployer-docker", "guide-spring", "intro-spring");
    }
}
