package com.brandonkamga.lescracks.content.domain.port;

import com.brandonkamga.lescracks.content.domain.model.Article;
import com.brandonkamga.lescracks.content.domain.model.ArticleSearch;
import com.brandonkamga.lescracks.content.domain.model.ArticleStatus;
import com.brandonkamga.lescracks.shared.paging.PageQuery;
import com.brandonkamga.lescracks.shared.paging.Paged;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Optional;

public interface ArticleStore {

    /** With its body. */
    Optional<Article> findById(Long id);

    /** With its body. */
    Optional<Article> findBySlug(String slug);

    boolean slugTaken(String slug);

    /** Newest first; {@code withBody} false for cards. Tags come in one more query for the whole page. */
    Paged<Article> search(ArticleSearch search, PageQuery page, boolean withBody);

    /** Without bodies, one query. */
    List<Article> findAllById(Collection<Long> ids);

    List<Long> findScheduledIds(Instant now);

    /** Published articles per theme, keyed by category id. */
    Map<Long, Long> countPublishedByCategory();

    Article save(Article article);

    void delete(Long id);
}
