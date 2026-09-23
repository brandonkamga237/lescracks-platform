package com.brandonkamga.lescracks.taxonomy.infra;

import com.brandonkamga.lescracks.taxonomy.domain.Tag;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TagRepository extends JpaRepository<Tag, Long> {

    List<Tag> findAllByOrderByNameAsc();

    List<Tag> findByCategoryIdOrderByNameAsc(Long categoryId);

    boolean existsByNameIgnoreCaseAndCategoryId(String name, Long categoryId);
}
