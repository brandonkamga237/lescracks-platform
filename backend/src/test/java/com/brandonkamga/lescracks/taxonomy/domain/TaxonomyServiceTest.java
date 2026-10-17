package com.brandonkamga.lescracks.taxonomy.domain;

import com.brandonkamga.lescracks.shared.exception.BadRequestException;
import com.brandonkamga.lescracks.taxonomy.infra.CategoryRepository;
import com.brandonkamga.lescracks.taxonomy.infra.TagRepository;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TaxonomyServiceTest {

    @Mock private CategoryRepository categories;
    @Mock private TagRepository tags;

    private TaxonomyServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new TaxonomyServiceImpl(categories, tags);
    }

    @Test
    @DisplayName("a tag is unique by name whatever the case: « api » cannot join « API »")
    void tagNamesAreUnique() {
        when(tags.existsByNameIgnoreCase("api")).thenReturn(true);

        assertThatThrownBy(() -> service.createTag(" api ")).isInstanceOf(BadRequestException.class);
        verify(tags, never()).save(any());
    }

    @Test
    @DisplayName("a new tag is stored trimmed, with no theme attached")
    void createsATag() {
        when(tags.existsByNameIgnoreCase("Spring Boot")).thenReturn(false);
        when(tags.save(any(Tag.class))).thenAnswer(call -> call.getArgument(0));

        assertThat(service.createTag("  Spring Boot ").getName()).isEqualTo("Spring Boot");
    }

    @Test
    @DisplayName("renaming a tag to the name of another one is refused; to its own name it is not")
    void renameKeepsNamesUnique() {
        Tag java = Tag.builder().id(1L).name("Java").build();
        Tag kotlin = Tag.builder().id(2L).name("Kotlin").build();
        when(tags.findById(2L)).thenReturn(Optional.of(kotlin));
        when(tags.findByNameIgnoreCase("java")).thenReturn(Optional.of(java));
        when(tags.findByNameIgnoreCase("KOTLIN")).thenReturn(Optional.of(kotlin));

        assertThatThrownBy(() -> service.renameTag(2L, "java")).isInstanceOf(BadRequestException.class);
        assertThat(service.renameTag(2L, "KOTLIN").getName()).isEqualTo("KOTLIN");
    }

    @Test
    @DisplayName("a theme still used by articles cannot be deleted, and the admin is told why")
    void themeInUse() {
        Category backend = Category.builder().id(3L).name("Backend & bases de données").slug("backend").build();
        when(categories.findById(3L)).thenReturn(Optional.of(backend));
        doThrow(new DataIntegrityViolationException("fk")).when(categories).flush();

        assertThatThrownBy(() -> service.deleteCategory(3L))
                .isInstanceOf(BadRequestException.class).hasMessageContaining("articles");
    }

    @Test
    @DisplayName("tags are listed in alphabetical order")
    void listsTags() {
        when(tags.findAllByOrderByNameAsc()).thenReturn(List.of(Tag.builder().name("API").build()));

        assertThat(service.tags()).extracting(Tag::getName).containsExactly("API");
    }
}
