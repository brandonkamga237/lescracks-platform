package com.brandonkamga.lescracks.taxonomy.application;

import com.brandonkamga.lescracks.taxonomy.domain.model.Category;
import com.brandonkamga.lescracks.taxonomy.domain.model.Tag;

import java.util.Collection;
import java.util.List;
import java.util.Map;

/**
 * How articles are organised: a few themes (categories, curated by admins, also used as member
 * interests) and free tags, unique by name, that authors put on an article.
 */
public interface TaxonomyService {

    List<Category> listCategories();

    Category createCategory(String name);

    Category renameCategory(Long id, String name);

    /** Creates the given themes that are missing; one an admin renamed or added is left as it is. */
    int ensureCategories(List<Category> themes);

    /** Refuses while articles still use the theme, rather than orphaning them. */
    void deleteCategory(Long id);

    List<Tag> listTags();

    Tag createTag(String name);

    Tag renameTag(Long id, String name);

    void deleteTag(Long id);

    Category requireCategory(Long id);

    /** Resolves ids to tags, refusing any that does not exist rather than silently dropping it. */
    List<Tag> requireTags(Collection<Long> ids);

    /** Several themes in one query; unknown ids are absent. */
    Map<Long, Category> findCategories(Collection<Long> ids);

    /** Several tags in one query; unknown ids are absent. */
    Map<Long, Tag> findTags(Collection<Long> ids);
}
