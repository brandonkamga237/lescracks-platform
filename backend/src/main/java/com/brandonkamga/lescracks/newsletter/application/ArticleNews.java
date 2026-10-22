package com.brandonkamga.lescracks.newsletter.application;

/** A newly published article, as subscribers are told about it. {@code path} is the page on the site. */
public record ArticleNews(String title, String description, String path, String coverImage) {
}
