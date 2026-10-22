package com.brandonkamga.lescracks.content.application;

import com.brandonkamga.lescracks.content.domain.model.ArticleSearch;
import com.brandonkamga.lescracks.shared.paging.PageQuery;
import com.brandonkamga.lescracks.shared.paging.Paged;
import com.brandonkamga.lescracks.storage.domain.Upload;

/** The back office's articles: every status, with their bodies, written and deleted. */
public interface ArticleAdminService {

    Paged<ArticleView> list(ArticleSearch search, PageQuery page);

    ArticleView create(ArticleDraft draft, Upload cover);

    ArticleView update(Long id, ArticleDraft draft, Upload cover);

    void delete(Long id);
}
