package com.brandonkamga.lescracks.content.domain.model;

/** Catalogue and back-office filters; null means "any". */
public record ArticleSearch(ArticleStatus status, String text, Long categoryId, Long tagId, Order order) {

    /** Readers see the newest publication first; the back office, the newest draft first. */
    public enum Order { PUBLICATION, CREATION }

    public static ArticleSearch published(String text, Long categoryId, Long tagId) {
        return new ArticleSearch(ArticleStatus.PUBLISHED, text, categoryId, tagId, Order.PUBLICATION);
    }

    public static ArticleSearch backOffice(ArticleStatus status, String text, Long categoryId, Long tagId) {
        return new ArticleSearch(status, text, categoryId, tagId, Order.CREATION);
    }
}
