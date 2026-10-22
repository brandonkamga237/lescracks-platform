package com.brandonkamga.lescracks.content.api;

import com.brandonkamga.lescracks.content.api.dto.ArticleRequest;
import com.brandonkamga.lescracks.content.api.dto.ArticleResponse;
import com.brandonkamga.lescracks.content.api.dto.ThemeResponse;
import com.brandonkamga.lescracks.content.application.ArticleAdminService;
import com.brandonkamga.lescracks.content.application.ArticleCatalog;
import com.brandonkamga.lescracks.content.domain.model.ArticleSearch;
import com.brandonkamga.lescracks.content.domain.model.ArticleStatus;
import com.brandonkamga.lescracks.shared.dto.PageResponse;
import com.brandonkamga.lescracks.shared.paging.PageQuery;
import com.brandonkamga.lescracks.storage.api.Uploads;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/** The blog's articles. The routes keep their old "resources" name, which the frontend and shared links use. */
@RestController
@RequestMapping("/api/resources")
@Tag(name = "Articles")
public class ArticleController {
    private static final int MAX_PAGE_SIZE = 100;

    private final ArticleCatalog catalog;
    private final ArticleAdminService admin;

    public ArticleController(ArticleCatalog catalog, ArticleAdminService admin) {
        this.catalog = catalog;
        this.admin = admin;
    }

    @GetMapping
    @Operation(summary = "Consulter les articles publiés")
    public PageResponse<ArticleResponse> published(@RequestParam(required = false) String search,
                                                   @RequestParam(required = false) Long categoryId,
                                                   @RequestParam(required = false) Long tagId,
                                                   @RequestParam(defaultValue = "0") int page,
                                                   @RequestParam(defaultValue = "12") int size) {
        return PageResponse.of(catalog.search(search, categoryId, tagId, pageOf(page, size)), ArticleResponse::of);
    }

    @GetMapping("/themes")
    @Operation(summary = "Les thèmes qui contiennent des articles publiés, avec leur nombre")
    public List<ThemeResponse> themes() {
        return catalog.listThemes().stream().map(ThemeResponse::of).toList();
    }

    @GetMapping("/{slug}")
    @Operation(summary = "Consulter un article publié")
    public ArticleResponse get(@PathVariable String slug) {
        return ArticleResponse.of(catalog.requirePublished(slug));
    }

    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public PageResponse<ArticleResponse> all(@RequestParam(required = false) ArticleStatus status,
                                             @RequestParam(required = false) String search,
                                             @RequestParam(required = false) Long categoryId,
                                             @RequestParam(required = false) Long tagId,
                                             @RequestParam(defaultValue = "0") int page,
                                             @RequestParam(defaultValue = "20") int size) {
        return PageResponse.of(admin.list(new ArticleSearch(status, search, categoryId, tagId), pageOf(page, size)),
                ArticleResponse::of);
    }

    @PostMapping(value = "/admin/articles", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    public ArticleResponse create(@Valid @RequestPart("data") ArticleRequest request,
                                  @RequestPart(value = "coverImageFile", required = false) MultipartFile coverImageFile) {
        return ArticleResponse.of(admin.create(request.toDraft(), Uploads.of(coverImageFile)));
    }

    @PutMapping(value = "/admin/articles/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ADMIN')")
    public ArticleResponse update(@PathVariable Long id,
                                  @Valid @RequestPart("data") ArticleRequest request,
                                  @RequestPart(value = "coverImageFile", required = false) MultipartFile coverImageFile) {
        return ArticleResponse.of(admin.update(id, request.toDraft(), Uploads.of(coverImageFile)));
    }

    @DeleteMapping("/admin/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        admin.delete(id);
    }

    private static PageQuery pageOf(int page, int size) {
        return new PageQuery(Math.max(0, page), Math.clamp(size, 1, MAX_PAGE_SIZE));
    }
}
