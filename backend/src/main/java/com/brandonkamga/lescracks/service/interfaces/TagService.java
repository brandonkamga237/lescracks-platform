package com.brandonkamga.lescracks.service.interfaces;

import com.brandonkamga.lescracks.domain.Tag;

import java.util.List;
import java.util.Optional;

/**
 * Service interface for Tag (InterestTag) operations.
 */
public interface TagService {

    /**
     * Find a tag by ID.
     *
     * @param id the tag ID
     * @return the tag if found
     */
    Tag findById(Long id);

    /**
     * Find a tag by ID as Optional.
     *
     * @param id the tag ID
     * @return Optional containing the tag if found
     */
    Optional<Tag> findByIdOptional(Long id);

    /**
     * Find all tags.
     *
     * @return list of all tags
     */
    List<Tag> findAll();

    /**
     * Find a tag by name.
     *
     * @param name the tag name
     * @return Optional containing the tag if found
     */
    Optional<Tag> findByName(String name);

    /**
     * Find tags by category ID.
     *
     * @param categoryId the category ID
     * @return list of tags in the specified category
     */
    List<Tag> findByCategoryId(Long categoryId);

    /**
     * Save a tag.
     *
     * @param tag the tag to save
     * @return the saved tag
     */
    Tag save(Tag tag);

    /**
     * Delete a tag by ID.
     *
     * @param id the tag ID
     */
    void deleteById(Long id);
}
