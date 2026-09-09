package com.brandonkamga.lescracks.repository;

import com.brandonkamga.lescracks.domain.Article;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ArticleRepository extends JpaRepository<Article, Long> {

    Optional<Article> findByResourceId(Long resourceId);
}
