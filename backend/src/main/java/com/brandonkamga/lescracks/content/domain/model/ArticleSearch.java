package com.brandonkamga.lescracks.content.domain.model;

/** Catalogue and back-office filters; null means "any". */
public record ArticleSearch(ArticleStatus status, String text, Long categoryId, Long tagId) {

    public static ArticleSearch published(String text, Long categoryId, Long tagId) {
        return new ArticleSearch(ArticleStatus.PUBLISHED, text, categoryId, tagId);
    }
}
