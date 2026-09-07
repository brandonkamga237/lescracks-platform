package com.brandonkamga.lescracks.repository;

import com.brandonkamga.lescracks.domain.Ebook;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface EbookRepository extends JpaRepository<Ebook, Long> {
    Optional<Ebook> findByResourceId(Long resourceId);
}