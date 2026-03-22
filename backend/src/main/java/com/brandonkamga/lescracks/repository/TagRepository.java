package com.brandonkamga.lescracks.repository;

import com.brandonkamga.lescracks.domain.Tag;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TagRepository extends JpaRepository<Tag, Long> {
    Optional<Tag> findByName(String name);
    List<Tag> findByCategoryId(Long categoryId);
}
