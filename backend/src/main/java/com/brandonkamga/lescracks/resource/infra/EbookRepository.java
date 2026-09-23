package com.brandonkamga.lescracks.resource.infra;

import com.brandonkamga.lescracks.resource.domain.Ebook;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface EbookRepository extends JpaRepository<Ebook, Long> {
    Optional<Ebook> findByResourceId(Long resourceId);
}