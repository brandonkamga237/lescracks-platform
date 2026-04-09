package com.brandonkamga.lescracks.repository;

import com.brandonkamga.lescracks.domain.OpenSourceProject;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OpenSourceProjectRepository extends JpaRepository<OpenSourceProject, Long> {
    List<OpenSourceProject> findByVisibleTrueOrderByFeaturedOrderAsc();
    List<OpenSourceProject> findByFeaturedTrueAndVisibleTrueOrderByFeaturedOrderAsc();
}
