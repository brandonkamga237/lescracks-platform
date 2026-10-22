package com.brandonkamga.lescracks.content.application;

import com.brandonkamga.lescracks.content.domain.model.Article;
import com.brandonkamga.lescracks.shared.paging.PageQuery;
import com.brandonkamga.lescracks.shared.paging.Paged;

import java.util.List;

/** What visitors read: published articles only. */
public interface ArticleCatalog {

    /** Cards, newest first, without bodies. */
    Paged<ArticleView> search(String text, Long categoryId, Long tagId, PageQuery page);

    /** By slug, or by id for old links; anything unpublished answers as not found. */
    ArticleView requirePublished(String slugOrId);

    /** Themes holding published articles, the fullest first; empty themes are left out. */
    List<ThemeCount> listThemes();

    /** Every published article, without bodies, for the sitemap and the bot snapshots. */
    List<Article> listPublished();
}
