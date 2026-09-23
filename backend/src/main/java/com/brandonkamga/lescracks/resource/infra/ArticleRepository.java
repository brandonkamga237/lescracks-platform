package com.brandonkamga.lescracks.resource.infra;

import com.brandonkamga.lescracks.resource.domain.Article;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ArticleRepository extends JpaRepository<Article, Long> {

    Optional<Article> findByResourceId(Long resourceId);
}
