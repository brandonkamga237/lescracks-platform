package com.brandonkamga.lescracks.content.api.dto;

import com.brandonkamga.lescracks.content.application.ThemeCount;

/** A blog theme as visitors browse it: only themes that hold at least one article are listed. */
public record ThemeResponse(Long id, String name, String slug, String description, long articleCount) {

    public static ThemeResponse of(ThemeCount entry) {
        var theme = entry.theme();
        return new ThemeResponse(theme.getId(), theme.getName(), theme.getSlug(), theme.getDescription(), entry.articles());
    }
}
