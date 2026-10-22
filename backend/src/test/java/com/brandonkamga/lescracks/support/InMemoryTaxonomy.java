package com.brandonkamga.lescracks.support;

import com.brandonkamga.lescracks.taxonomy.application.TaxonomyService;
import com.brandonkamga.lescracks.taxonomy.application.TaxonomyServiceImpl;
import com.brandonkamga.lescracks.taxonomy.domain.model.Category;
import com.brandonkamga.lescracks.taxonomy.domain.model.Tag;
import com.brandonkamga.lescracks.taxonomy.domain.port.CategoryStore;
import com.brandonkamga.lescracks.taxonomy.domain.port.TagStore;

import java.util.Collection;
import java.util.Comparator;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.atomic.AtomicLong;

/** Copying fakes for taxonomy's stores, and the real service on top: modules that read themes and tags test against it. */
public final class InMemoryTaxonomy {

    public final Categories categories = new Categories();
    public final Tags tags = new Tags();
    public final TaxonomyService service = new TaxonomyServiceImpl(categories, tags);

    public Category theme(String name) {
        return categories.save(Category.builder().name(name).slug(name.toLowerCase().replace(' ', '-')).build());
    }

    public Tag tag(String name) {
        return tags.save(Tag.builder().name(name).build());
    }

    public static final class Categories implements CategoryStore {
        private final Map<Long, Category> rows = new LinkedHashMap<>();
        private final AtomicLong ids = new AtomicLong(1);
        /** Themes the database would refuse to delete because articles use them. */
        public final Set<Long> inUse = new HashSet<>();

        @Override
        public List<Category> findAll() {
            return rows.values().stream().sorted(Comparator.comparing(Category::getName)).map(category -> category.toBuilder().build()).toList();
        }

        @Override
        public List<Category> findAllById(Collection<Long> ids) {
            return ids.stream().map(rows::get).filter(category -> category != null).map(category -> category.toBuilder().build()).toList();
        }

        @Override
        public Optional<Category> findById(Long id) {
            return Optional.ofNullable(rows.get(id)).map(category -> category.toBuilder().build());
        }

        @Override
        public Optional<Category> findByName(String name) {
            return rows.values().stream().filter(category -> category.getName().equalsIgnoreCase(name)).findFirst()
                    .map(category -> category.toBuilder().build());
        }

        @Override
        public Optional<Category> findBySlug(String slug) {
            return rows.values().stream().filter(category -> slug.equals(category.getSlug())).findFirst()
                    .map(category -> category.toBuilder().build());
        }

        @Override
        public Category save(Category category) {
            Category stored = category.toBuilder().id(category.getId() == null ? ids.getAndIncrement() : category.getId()).build();
            rows.put(stored.getId(), stored);
            return stored.toBuilder().build();
        }

        @Override
        public boolean delete(Long id) {
            if (inUse.contains(id)) return false;
            rows.remove(id);
            return true;
        }
    }

    public static final class Tags implements TagStore {
        private final Map<Long, Tag> rows = new LinkedHashMap<>();
        private final AtomicLong ids = new AtomicLong(1);

        @Override
        public List<Tag> findAll() {
            return rows.values().stream().sorted(Comparator.comparing(Tag::getName)).map(tag -> tag.toBuilder().build()).toList();
        }

        @Override
        public List<Tag> findAllById(Collection<Long> ids) {
            return ids.stream().map(rows::get).filter(tag -> tag != null).map(tag -> tag.toBuilder().build()).toList();
        }

        @Override
        public Optional<Tag> findById(Long id) {
            return Optional.ofNullable(rows.get(id)).map(tag -> tag.toBuilder().build());
        }

        @Override
        public Optional<Tag> findByName(String name) {
            return rows.values().stream().filter(tag -> tag.getName().equalsIgnoreCase(name)).findFirst().map(tag -> tag.toBuilder().build());
        }

        @Override
        public Tag save(Tag tag) {
            Tag stored = tag.toBuilder().id(tag.getId() == null ? ids.getAndIncrement() : tag.getId()).build();
            rows.put(stored.getId(), stored);
            return stored.toBuilder().build();
        }

        @Override
        public void delete(Long id) {
            rows.remove(id);
        }
    }
}
