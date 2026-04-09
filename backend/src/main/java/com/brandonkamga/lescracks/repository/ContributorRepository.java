package com.brandonkamga.lescracks.repository;

import com.brandonkamga.lescracks.domain.Contributor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ContributorRepository extends JpaRepository<Contributor, Long> {
    List<Contributor> findByVisibleTrueOrderByDisplayOrderAsc();
}
