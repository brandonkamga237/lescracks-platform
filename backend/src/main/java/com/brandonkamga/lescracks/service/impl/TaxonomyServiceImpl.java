package com.brandonkamga.lescracks.service.impl;

import com.brandonkamga.lescracks.domain.Category;
import com.brandonkamga.lescracks.domain.Tag;
import com.brandonkamga.lescracks.exception.BadRequestException;
import com.brandonkamga.lescracks.exception.NotFoundException;
import com.brandonkamga.lescracks.repository.CategoryRepository;
import com.brandonkamga.lescracks.repository.TagRepository;
import com.brandonkamga.lescracks.service.interfaces.TaxonomyService;
import com.brandonkamga.lescracks.util.Slugs;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collection;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@Transactional
public class TaxonomyServiceImpl implements TaxonomyService {

    private final CategoryRepository categories;
    private final TagRepository tags;

    public TaxonomyServiceImpl(CategoryRepository categories, TagRepository tags) {
        this.categories = categories;
        this.tags = tags;
    }

    @Override
    @Transactional(readOnly = true)
    public List<Category> categories() {
        return categories.findAllByOrderByNameAsc();
    }

    @Override
    public Category createCategory(String name) {
        String clean = require(name, "Le nom de la catégorie est obligatoire.");
        if (categories.existsByNameIgnoreCase(clean)) {
            throw new BadRequestException("Une catégorie porte déjà ce nom.");
        }
        return categories.save(Category.builder().name(clean)
            .slug(Slugs.uniqueFrom(clean, categories::existsBySlug)).build());
    }

    @Override
    public Category renameCategory(Long id, String name) {
        String clean = require(name, "Le nom de la catégorie est obligatoire.");
        Category category = requireCategory(id);
        boolean takenByAnother = categories.findByNameIgnoreCase(clean)
                .filter(other -> !other.getId().equals(id))
                .isPresent();
        if (takenByAnother) {
            throw new BadRequestException("Une autre catégorie porte déjà ce nom.");
        }
        category.setName(clean);
        category.setSlug(Slugs.uniqueFrom(clean,
            slug -> categories.findBySlug(slug)
                .filter(other -> !other.getId().equals(id))
                .map(other -> true).orElse(false)));
        return category;
    }

    @Override
    public void deleteCategory(Long id) {
        Category category = requireCategory(id);
        // The database would refuse this too; saying why here is what makes it actionable.
        if (!tags.findByCategoryIdOrderByNameAsc(id).isEmpty()) {
            throw new BadRequestException(
                    "Cette catégorie contient encore des tags. Supprimez-les d'abord.");
        }
        categories.delete(category);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Tag> tags() {
        return tags.findAllByOrderByNameAsc();
    }

    @Override
    @Transactional(readOnly = true)
    public List<Tag> tagsIn(Long categoryId) {
        return tags.findByCategoryIdOrderByNameAsc(categoryId);
    }

    @Override
    public Tag createTag(String name, Long categoryId) {
        String clean = require(name, "Le nom du tag est obligatoire.");
        Category category = requireCategory(categoryId);
        if (tags.existsByNameIgnoreCaseAndCategoryId(clean, categoryId)) {
            throw new BadRequestException("Ce tag existe déjà dans cette catégorie.");
        }
        return tags.save(Tag.builder().name(clean).category(category).build());
    }

    @Override
    public Tag updateTag(Long id, String name, Long categoryId) {
        Tag tag = requireTag(id);
        tag.setName(require(name, "Le nom du tag est obligatoire."));
        tag.setCategory(requireCategory(categoryId));
        return tag;
    }

    @Override
    public void deleteTag(Long id) {
        tags.delete(requireTag(id));
    }

    @Override
    @Transactional(readOnly = true)
    public Set<Tag> requireAll(Collection<Long> ids) {
        if (ids == null || ids.isEmpty()) {
            return Set.of();
        }
        Set<Tag> found = new HashSet<>(tags.findAllById(ids));
        if (found.size() != Set.copyOf(ids).size()) {
            throw new BadRequestException("Un ou plusieurs tags n'existent pas.");
        }
        return found;
    }

    @Override
    @Transactional(readOnly = true)
    public Category requireCategory(Long id) {
        return categories.findById(id)
                .orElseThrow(() -> new NotFoundException("Category", "id", id));
    }

    private Tag requireTag(Long id) {
        return tags.findById(id).orElseThrow(() -> new NotFoundException("Tag", "id", id));
    }

    private String require(String value, String message) {
        if (value == null || value.isBlank()) {
            throw new BadRequestException(message);
        }
        return value.strip();
    }
}
