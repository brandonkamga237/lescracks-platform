package com.brandonkamga.lescracks.content.application;

import com.brandonkamga.lescracks.content.domain.model.Article;
import com.brandonkamga.lescracks.engagement.domain.model.Counts;
import com.brandonkamga.lescracks.taxonomy.domain.model.Category;

import java.util.List;

/** An article with what its card and page show around it: theme, tag names, audience. */
public record ArticleView(Article article, Category category, List<String> tags, Counts counts) {
}
