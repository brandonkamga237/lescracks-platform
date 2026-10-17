package com.brandonkamga.lescracks.taxonomy.domain;

import java.util.Collection;
import java.util.List;
import java.util.Set;

/**
 * How articles are organised: a few themes (categories, curated by admins, also used as member
 * interests) and free tags, unique by name, that authors put on an article.
 */
public interface TaxonomyService {

    List<Category> categories();

    Category createCategory(String name);

    Category renameCategory(Long id, String name);

    /** Refuses while articles still use the theme, rather than orphaning them. */
    void deleteCategory(Long id);

    List<Tag> tags();


    Tag createTag(String name);

    Tag renameTag(Long id, String name);

    void deleteTag(Long id);

    /** Resolves ids to tags, refusing any that does not exist rather than silently dropping it. */
    Set<Tag> requireAll(Collection<Long> ids);

    Category requireCategory(Long id);
}
