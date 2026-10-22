package com.brandonkamga.lescracks.taxonomy.domain.port;

import com.brandonkamga.lescracks.taxonomy.domain.model.Category;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface CategoryStore {

    /** By name. */
    List<Category> findAll();

    List<Category> findAllById(Collection<Long> ids);

    Optional<Category> findById(Long id);

    /** Ignores case. */
    Optional<Category> findByName(String name);

    Optional<Category> findBySlug(String slug);

    Category save(Category category);

    /** False when content still uses the theme: the database refuses to orphan it. */
    boolean delete(Long id);
}
