package com.brandonkamga.lescracks.service;

import com.brandonkamga.lescracks.domain.Category;
import com.brandonkamga.lescracks.domain.Tag;
import com.brandonkamga.lescracks.exception.BadRequestException;
import com.brandonkamga.lescracks.exception.NotFoundException;
import com.brandonkamga.lescracks.repository.CategoryRepository;
import com.brandonkamga.lescracks.repository.TagRepository;
import com.brandonkamga.lescracks.service.impl.TaxonomyServiceImpl;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Naming and grouping, which sounds trivial until two categories are called "Backend" and
 * nobody can tell which filter they clicked.
 *
 * Doubled repositories rather than a database: what is under test is the decision to refuse,
 * and every refusal here has a sentence attached because an admin acts on it.
 */
@ExtendWith(MockitoExtension.class)
class TaxonomyServiceTest {

    @Mock
    CategoryRepository categories;

    @Mock
    TagRepository tags;

    @InjectMocks
    TaxonomyServiceImpl service;

    private static Category backend() {
        return Category.builder().id(1L).name("Backend").build();
    }

    @ParameterizedTest
    @NullSource
    @ValueSource(strings = {"", "   "})
    @DisplayName("a category with no name is refused before anything is written")
    void refusesAnEmptyCategoryName(String name) {
        assertThatThrownBy(() -> service.createCategory(name))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("obligatoire");

        verify(categories, never()).save(any());
    }

    @Test
    @DisplayName("a category name is trimmed on the way in")
    void trimsTheName() {
        when(categories.existsByNameIgnoreCase("Backend")).thenReturn(false);
        when(categories.save(any())).thenAnswer(call -> call.getArgument(0));

        assertThat(service.createCategory("  Backend  ").getName()).isEqualTo("Backend");
    }

    @Test
    @DisplayName("two categories cannot share a name, whatever the casing")
    void refusesADuplicateCategory() {
        when(categories.existsByNameIgnoreCase("backend")).thenReturn(true);

        assertThatThrownBy(() -> service.createCategory("backend"))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("déjà ce nom");
    }

    @Test
    @DisplayName("renaming a category to a name another holds is refused")
    void refusesRenamingOntoAnotherCategory() {
        when(categories.findById(1L)).thenReturn(Optional.of(backend()));
        when(categories.findByNameIgnoreCase("DevOps"))
                .thenReturn(Optional.of(Category.builder().id(2L).name("DevOps").build()));

        assertThatThrownBy(() -> service.renameCategory(1L, "DevOps"))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Une autre catégorie");
    }

    @Test
    @DisplayName("renaming a category to the name it already holds is allowed")
    void allowsRenamingToItsOwnName() {
        Category category = backend();
        when(categories.findById(1L)).thenReturn(Optional.of(category));
        when(categories.findByNameIgnoreCase("Backend")).thenReturn(Optional.of(category));

        // Otherwise fixing the casing of a name would be impossible.
        assertThat(service.renameCategory(1L, "Backend").getName()).isEqualTo("Backend");
    }

    @Test
    @DisplayName("a category still holding tags is not deleted silently")
    void refusesToDeleteANonEmptyCategory() {
        when(categories.findById(1L)).thenReturn(Optional.of(backend()));
        when(tags.findByCategoryIdOrderByNameAsc(1L))
                .thenReturn(List.of(Tag.builder().id(5L).name("Spring").build()));

        assertThatThrownBy(() -> service.deleteCategory(1L))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Supprimez-les d'abord");

        verify(categories, never()).delete(any());
    }

    @Test
    @DisplayName("an empty category is deleted")
    void deletesAnEmptyCategory() {
        Category category = backend();
        when(categories.findById(1L)).thenReturn(Optional.of(category));
        when(tags.findByCategoryIdOrderByNameAsc(1L)).thenReturn(List.of());

        service.deleteCategory(1L);

        verify(categories).delete(category);
    }

    @Test
    @DisplayName("a category that does not exist is not found")
    void refusesAnUnknownCategory() {
        when(categories.findById(anyLong())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.deleteCategory(999L)).isInstanceOf(NotFoundException.class);
        assertThatThrownBy(() -> service.renameCategory(999L, "X")).isInstanceOf(NotFoundException.class);
    }

    @Test
    @DisplayName("a tag needs a category that exists")
    void refusesATagInAnUnknownCategory() {
        when(categories.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.createTag("Spring", 999L))
                .isInstanceOf(NotFoundException.class);
        verify(tags, never()).save(any());
    }

    @Test
    @DisplayName("the same tag name may live in two different categories")
    void allowsTheSameTagNameInAnotherCategory() {
        when(categories.findById(2L)).thenReturn(Optional.of(Category.builder().id(2L).name("DevOps").build()));
        when(tags.existsByNameIgnoreCaseAndCategoryId("Spring", 2L)).thenReturn(false);
        when(tags.save(any())).thenAnswer(call -> call.getArgument(0));

        // The uniqueness that matters is within a category, not across the catalogue.
        assertThat(service.createTag("Spring", 2L).getName()).isEqualTo("Spring");
    }

    @Test
    @DisplayName("but not twice in the same one")
    void refusesADuplicateTagInACategory() {
        when(categories.findById(1L)).thenReturn(Optional.of(backend()));
        when(tags.existsByNameIgnoreCaseAndCategoryId("Spring", 1L)).thenReturn(true);

        assertThatThrownBy(() -> service.createTag("Spring", 1L))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("existe déjà");
    }

    @Test
    @DisplayName("a tag with no name is refused")
    void refusesAnEmptyTagName() {
        assertThatThrownBy(() -> service.createTag("  ", 1L))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("obligatoire");
    }

    @Test
    @DisplayName("updating a tag moves it and renames it in one step")
    void updatesATag() {
        Tag tag = Tag.builder().id(5L).name("Spring").category(backend()).build();
        Category devops = Category.builder().id(2L).name("DevOps").build();
        when(tags.findById(5L)).thenReturn(Optional.of(tag));
        when(categories.findById(2L)).thenReturn(Optional.of(devops));

        Tag updated = service.updateTag(5L, "Spring Boot", 2L);

        assertThat(updated.getName()).isEqualTo("Spring Boot");
        assertThat(updated.getCategory()).isEqualTo(devops);
    }

    @Test
    @DisplayName("a tag is deleted without asking anything of its category")
    void deletesATag() {
        Tag tag = Tag.builder().id(5L).name("Spring").build();
        when(tags.findById(5L)).thenReturn(Optional.of(tag));

        service.deleteTag(5L);

        verify(tags).delete(tag);
    }

    @Test
    @DisplayName("listings come out sorted, so a filter list reads the same every time")
    void listingsAreSorted() {
        when(categories.findAllByOrderByNameAsc()).thenReturn(List.of(backend()));
        when(tags.findAllByOrderByNameAsc()).thenReturn(List.of(Tag.builder().id(5L).build()));

        assertThat(service.categories()).hasSize(1);
        assertThat(service.tags()).hasSize(1);
        verify(categories).findAllByOrderByNameAsc();
        verify(tags).findAllByOrderByNameAsc();
    }
}
