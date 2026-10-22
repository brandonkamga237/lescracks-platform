package com.brandonkamga.lescracks.content.application;

import com.brandonkamga.lescracks.content.domain.model.Talk;
import com.brandonkamga.lescracks.shared.paging.PageQuery;
import com.brandonkamga.lescracks.shared.paging.Paged;

/** LesCracks Talk episodes: visitors read the published ones, the back office manages them all. */
public interface TalkService {

    Paged<Talk> listPublished(PageQuery page);

    Talk requirePublished(Long id);

    Paged<Talk> listAll(PageQuery page);

    Talk create(TalkDraft draft);

    Talk update(Long id, TalkDraft draft);

    void delete(Long id);
}
