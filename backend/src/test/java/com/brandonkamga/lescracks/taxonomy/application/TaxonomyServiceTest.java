package com.brandonkamga.lescracks.taxonomy.application;

import com.brandonkamga.lescracks.shared.exception.BadRequestException;
import com.brandonkamga.lescracks.support.InMemoryTaxonomy;
import com.brandonkamga.lescracks.taxonomy.domain.model.Category;
import com.brandonkamga.lescracks.taxonomy.domain.model.Tag;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class TaxonomyServiceTest {

    private final InMemoryTaxonomy taxonomy = new InMemoryTaxonomy();
    private final TaxonomyService service = taxonomy.service;

    @Test
    @DisplayName("a tag is unique by name whatever the case: « api » cannot join « API »")
    void tagNamesAreUnique() {
        taxonomy.tag("API");

        assertThatThrownBy(() -> service.createTag(" api ")).isInstanceOf(BadRequestException.class);
        assertThat(taxonomy.tags.findAll()).hasSize(1);
    }

    @Test
    @DisplayName("a new tag is stored trimmed")
    void createsATag() {
        service.createTag("  Spring Boot ");

        assertThat(taxonomy.tags.findAll()).extracting(Tag::getName).containsExactly("Spring Boot");
    }

    @Test
    @DisplayName("renaming a tag to the name of another one is refused; to its own name in another case it is not")
    void renameKeepsNamesUnique() {
        taxonomy.tag("Java");
        Tag kotlin = taxonomy.tag("Kotlin");

        assertThatThrownBy(() -> service.renameTag(kotlin.getId(), "java")).isInstanceOf(BadRequestException.class);
        service.renameTag(kotlin.getId(), "KOTLIN");

        assertThat(taxonomy.tags.findById(kotlin.getId())).get().extracting(Tag::getName).isEqualTo("KOTLIN");
    }

    @Test
    @DisplayName("a new theme gets a slug of its own, never one another theme already has")
    void themeSlugsStayUnique() {
        taxonomy.categories.save(Category.builder().name("Ancien Mobile").slug("mobile").build());

        Category created = service.createCategory("Mobile");

        assertThat(created.getSlug()).isEqualTo("mobile-2");
    }

    @Test
    @DisplayName("a theme still used by articles cannot be deleted, and the admin is told why")
    void themeInUse() {
        Category backend = taxonomy.theme("Backend");
        taxonomy.categories.inUse.add(backend.getId());

        assertThatThrownBy(() -> service.deleteCategory(backend.getId()))
                .isInstanceOf(BadRequestException.class).hasMessageContaining("articles");
        assertThat(taxonomy.categories.findById(backend.getId())).isPresent();
    }

    @Test
    @DisplayName("seeding themes adds the missing ones and leaves one an admin already has alone")
    void ensuresThemes() {
        taxonomy.categories.save(Category.builder().name("Mobile").slug("mobile").description("Écrit par un admin").build());

        int created = service.ensureCategories(List.of(
                Category.builder().name("Mobile").slug("mobile").description("Seed").build(),
                Category.builder().name("Data & IA").slug("data-ia").description("Seed").build()));

        assertThat(created).isEqualTo(1);
        assertThat(taxonomy.categories.findBySlug("mobile")).get().extracting(Category::getDescription).isEqualTo("Écrit par un admin");
        assertThat(taxonomy.categories.findBySlug("data-ia")).isPresent();
    }

    @Test
    @DisplayName("an unknown tag id is refused rather than silently dropped from an article")
    void unknownTagRefused() {
        Tag java = taxonomy.tag("Java");

        assertThatThrownBy(() -> service.requireTags(List.of(java.getId(), 404L))).isInstanceOf(BadRequestException.class);
    }
}
