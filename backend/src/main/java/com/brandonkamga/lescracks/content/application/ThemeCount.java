package com.brandonkamga.lescracks.content.application;

import com.brandonkamga.lescracks.taxonomy.domain.model.Category;

/** A theme with the number of published articles in it. */
public record ThemeCount(Category theme, long articles) {
}
