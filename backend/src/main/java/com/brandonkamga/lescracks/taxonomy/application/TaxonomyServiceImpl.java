package com.brandonkamga.lescracks.taxonomy.application;

import com.brandonkamga.lescracks.taxonomy.domain.model.Category;
import com.brandonkamga.lescracks.taxonomy.domain.model.Tag;
import com.brandonkamga.lescracks.taxonomy.domain.port.CategoryStore;
import com.brandonkamga.lescracks.taxonomy.domain.port.TagStore;
import com.brandonkamga.lescracks.shared.exception.BadRequestException;
import com.brandonkamga.lescracks.shared.exception.NotFoundException;
import com.brandonkamga.lescracks.shared.util.Slugs;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

public class TaxonomyServiceImpl implements TaxonomyService {
    private final CategoryStore categories;
    private final TagStore tags;

    public TaxonomyServiceImpl(CategoryStore categories, TagStore tags) {
        this.categories = categories;
        this.tags = tags;
    }

    @Override
    public List<Category> listCategories() {
        return categories.findAll();
    }

    @Override
    public Category createCategory(String name) {
        String clean = require(name, "Le nom de la catégorie est obligatoire.");
        if (categories.findByName(clean).isPresent()) {
            throw new BadRequestException("Une catégorie porte déjà ce nom.");
        }
        return categories.save(Category.builder().name(clean)
                .slug(Slugs.uniqueFrom(clean, slug -> categories.findBySlug(slug).isPresent())).build());
    }

    @Override
    public Category renameCategory(Long id, String name) {
        String clean = require(name, "Le nom de la catégorie est obligatoire.");
        Category category = requireCategory(id);
        if (categories.findByName(clean).filter(other -> !other.getId().equals(id)).isPresent()) {
            throw new BadRequestException("Une autre catégorie porte déjà ce nom.");
        }
        category.setName(clean);
        category.setSlug(Slugs.uniqueFrom(clean,
                slug -> categories.findBySlug(slug).filter(other -> !other.getId().equals(id)).isPresent()));
        return categories.save(category);
    }

    @Override
    public int ensureCategories(List<Category> themes) {
        int created = 0;
        for (Category theme : themes) {
            if (categories.findByName(theme.getName()).isPresent() || categories.findBySlug(theme.getSlug()).isPresent()) continue;
            categories.save(theme.toBuilder().id(null).build());
            created++;
        }
        return created;
    }

    @Override
    public void deleteCategory(Long id) {
        requireCategory(id);
        if (!categories.delete(id)) {
            throw new BadRequestException("Des articles utilisent encore ce thème. Change-les de thème avant de le supprimer.");
        }
    }

    @Override
    public List<Tag> listTags() {
        return tags.findAll();
    }

    @Override
    public Tag createTag(String name) {
        String clean = require(name, "Le nom du tag est obligatoire.");
        if (tags.findByName(clean).isPresent()) {
            throw new BadRequestException("Ce tag existe déjà.");
        }
        return tags.save(Tag.builder().name(clean).build());
    }

    @Override
    public Tag renameTag(Long id, String name) {
        Tag tag = requireTag(id);
        String clean = require(name, "Le nom du tag est obligatoire.");
        tags.findByName(clean).filter(other -> !other.getId().equals(id)).ifPresent(other -> {
            throw new BadRequestException("Ce tag existe déjà.");
        });
        tag.setName(clean);
        return tags.save(tag);
    }

    @Override
    public void deleteTag(Long id) {
        tags.delete(requireTag(id).getId());
    }

    @Override
    public Category requireCategory(Long id) {
        return categories.findById(id).orElseThrow(() -> new NotFoundException("Category", "id", id));
    }

    @Override
    public List<Tag> requireTags(Collection<Long> ids) {
        if (ids == null || ids.isEmpty()) return List.of();
        List<Tag> found = tags.findAllById(ids);
        if (found.size() != Set.copyOf(ids).size()) {
            throw new BadRequestException("Un ou plusieurs tags n'existent pas.");
        }
        return found;
    }

    @Override
    public Map<Long, Category> findCategories(Collection<Long> ids) {
        if (ids.isEmpty()) return Map.of();
        return categories.findAllById(ids).stream().collect(Collectors.toMap(Category::getId, Function.identity()));
    }

    @Override
    public Map<Long, Tag> findTags(Collection<Long> ids) {
        if (ids.isEmpty()) return Map.of();
        return tags.findAllById(ids).stream().collect(Collectors.toMap(Tag::getId, Function.identity()));
    }

    private Tag requireTag(Long id) {
        return tags.findById(id).orElseThrow(() -> new NotFoundException("Tag", "id", id));
    }

    private static String require(String value, String message) {
        if (value == null || value.isBlank()) throw new BadRequestException(message);
        return value.strip();
    }
}
