package com.brandonkamga.lescracks.repository;

import com.brandonkamga.lescracks.domain.Document;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DocumentRepository extends JpaRepository<Document, Long> {
}