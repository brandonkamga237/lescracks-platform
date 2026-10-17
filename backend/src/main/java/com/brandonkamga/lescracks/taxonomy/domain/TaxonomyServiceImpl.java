package com.brandonkamga.lescracks.taxonomy.domain;

import com.brandonkamga.lescracks.shared.exception.BadRequestException;
import com.brandonkamga.lescracks.shared.exception.NotFoundException;
import com.brandonkamga.lescracks.shared.util.Slugs;
import com.brandonkamga.lescracks.taxonomy.infra.CategoryRepository;
import com.brandonkamga.lescracks.taxonomy.infra.TagRepository;

import org.springframework.dao.DataIntegrityViolationException;
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
        // Articles point at their theme and the database refuses to orphan them. Taxonomy cannot
        // ask the resource domain (which depends on it), so the refusal is read and explained here.
        try {
            categories.delete(category);
            categories.flush();
        } catch (DataIntegrityViolationException stillUsed) {
            throw new BadRequestException("Des articles utilisent encore ce thème. Change-les de thème avant de le supprimer.");
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<Tag> tags() {
        return tags.findAllByOrderByNameAsc();
    }


    @Override
    public Tag createTag(String name) {
        String clean = require(name, "Le nom du tag est obligatoire.");
        if (tags.existsByNameIgnoreCase(clean)) {
            throw new BadRequestException("Ce tag existe déjà.");
        }
        return tags.save(Tag.builder().name(clean).build());
    }

    @Override
    public Tag renameTag(Long id, String name) {
        Tag tag = requireTag(id);
        String clean = require(name, "Le nom du tag est obligatoire.");
        tags.findByNameIgnoreCase(clean).filter(other -> !other.getId().equals(id)).ifPresent(other -> {
            throw new BadRequestException("Ce tag existe déjà.");
        });
        tag.setName(clean);
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
