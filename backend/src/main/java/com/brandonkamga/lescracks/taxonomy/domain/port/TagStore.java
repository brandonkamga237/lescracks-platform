package com.brandonkamga.lescracks.taxonomy.domain.port;

import com.brandonkamga.lescracks.taxonomy.domain.model.Tag;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface TagStore {

    /** By name. */
    List<Tag> findAll();

    List<Tag> findAllById(Collection<Long> ids);

    Optional<Tag> findById(Long id);

    /** Ignores case. */
    Optional<Tag> findByName(String name);

    Tag save(Tag tag);

    void delete(Long id);
}
