package com.brandonkamga.lescracks.taxonomy.infra;

import com.brandonkamga.lescracks.taxonomy.domain.Tag;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TagRepository extends JpaRepository<Tag, Long> {

    List<Tag> findAllByOrderByNameAsc();


    boolean existsByNameIgnoreCase(String name);

    Optional<Tag> findByNameIgnoreCase(String name);
}
