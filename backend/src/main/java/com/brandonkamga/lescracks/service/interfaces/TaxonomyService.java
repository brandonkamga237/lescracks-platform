package com.brandonkamga.lescracks.service.interfaces;

import com.brandonkamga.lescracks.domain.Category;
import com.brandonkamga.lescracks.domain.Tag;

import java.util.Collection;
import java.util.List;
import java.util.Set;

/**
 * How the catalogue is organised: categories, and the tags that belong to them.
 *
 * The two live together because they are never used apart — a tag without its category is
 * meaningless, and every screen that lists one lists the other.
 */
public interface TaxonomyService {

    List<Category> categories();

    Category createCategory(String name);

    Category renameCategory(Long id, String name);

    /** Refuses while resources still point at it, rather than orphaning them. */
    void deleteCategory(Long id);

    List<Tag> tags();

    List<Tag> tagsIn(Long categoryId);

    Tag createTag(String name, Long categoryId);

    Tag updateTag(Long id, String name, Long categoryId);

    void deleteTag(Long id);

    /** Resolves ids to tags, refusing any that does not exist rather than silently dropping it. */
    Set<Tag> requireAll(Collection<Long> ids);

    Category requireCategory(Long id);
}
