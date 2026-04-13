package com.brandonkamga.lescracks.repository;

import com.brandonkamga.lescracks.domain.Learner;
import com.brandonkamga.lescracks.domain.LearnerStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface LearnerRepository extends JpaRepository<Learner, Long> {

    List<Learner> findByVisibleTrueOrderByDisplayOrderAsc();

    List<Learner> findByVisibleTrueAndStatusOrderByDisplayOrderAsc(LearnerStatus status);

    List<Learner> findByShowcasedTrueAndVisibleTrueOrderByDisplayOrderAsc();

    Optional<Learner> findBySlug(String slug);

    boolean existsBySlug(String slug);

    Optional<Learner> findByUserId(Long userId);

    boolean existsByUserId(Long userId);
}
