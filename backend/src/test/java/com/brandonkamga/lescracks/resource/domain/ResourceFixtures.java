package com.brandonkamga.lescracks.resource.domain;

import com.brandonkamga.lescracks.taxonomy.domain.Category;
import com.brandonkamga.lescracks.taxonomy.domain.Tag;

/**
 * Builders for the resource domain. Lives beside the domain it describes rather than in a
 * global fixtures package: the vocabulary is the domain's, and so is the maintenance.
 *
 * No {@code *Test} suffix, so surefire ignores it.
 */
public final class ResourceFixtures {

    private ResourceFixtures() {
    }

    public static Category category(String name) {
        return Category.builder().name(name).slug(name.toLowerCase()).build();
    }

    public static Tag tag(Category category, String name) {
        return Tag.builder().category(category).name(name).build();
    }

    /** A resource with every non-nullable column filled, ready to be saved or stubbed. */
    public static Resource resource(Category category, String title, ResourceStatus status) {
        return Resource.builder()
                .category(category)
                .title(title)
                .slug(title.toLowerCase().replace(' ', '-'))
                .description("Description de " + title)
                .coverImage("https://cdn.example/cover.png")
                .status(status)
                .build();
    }

    public static Document document(String key) {
        return Document.builder().file(key).format("application/pdf").fileSize(1_024L).build();
    }
}
