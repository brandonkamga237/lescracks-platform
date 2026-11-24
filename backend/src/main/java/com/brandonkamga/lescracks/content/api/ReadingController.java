package com.brandonkamga.lescracks.content.api;

import com.brandonkamga.lescracks.content.api.dto.ArticleResponse;
import com.brandonkamga.lescracks.content.application.ArticleCatalog;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;
import java.util.List;

/** What the signed-in member read lately, for their dashboard. Under /api/me, so a member only ever sees their own. */
@RestController
@RequestMapping("/api/me/reading")
@Tag(name = "Articles")
public class ReadingController {
    private static final int MOST = 12;

    private final ArticleCatalog catalog;

    public ReadingController(ArticleCatalog catalog) {
        this.catalog = catalog;
    }

    @GetMapping
    @Operation(summary = "Les articles publiés que le membre a ouverts, les plus récents d'abord")
    public List<ArticleResponse> mine(@RequestParam(defaultValue = "6") int limit, Principal principal) {
        return catalog.listReadBy(principal.getName(), Math.clamp(limit, 1, MOST)).stream().map(ArticleResponse::of).toList();
    }
}
