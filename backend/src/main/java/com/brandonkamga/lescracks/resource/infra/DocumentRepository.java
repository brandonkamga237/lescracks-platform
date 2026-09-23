package com.brandonkamga.lescracks.resource.infra;

import com.brandonkamga.lescracks.resource.domain.Document;

import org.springframework.data.jpa.repository.JpaRepository;

public interface DocumentRepository extends JpaRepository<Document, Long> {
}