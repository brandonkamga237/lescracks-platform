package com.brandonkamga.lescracks.repository;

import com.brandonkamga.lescracks.domain.Category;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CategoryRepository extends JpaRepository<Category, Long> {

    Optional<Category> findByNameIgnoreCase(String name);

    boolean existsByNameIgnoreCase(String name);

    boolean existsBySlug(String slug);

    Optional<Category> findBySlug(String slug);

    List<Category> findAllByOrderByNameAsc();
}
