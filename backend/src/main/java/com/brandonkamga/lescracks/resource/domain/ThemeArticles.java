package com.brandonkamga.lescracks.resource.domain;

import com.brandonkamga.lescracks.taxonomy.domain.Category;

/** A theme with the number of published articles in it. */
public record ThemeArticles(Category theme, long articles) {
}
