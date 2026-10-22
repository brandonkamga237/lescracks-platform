package com.brandonkamga.lescracks.content.domain.port;

import com.brandonkamga.lescracks.content.domain.model.Talk;
import com.brandonkamga.lescracks.content.domain.model.TalkStatus;
import com.brandonkamga.lescracks.shared.paging.PageQuery;
import com.brandonkamga.lescracks.shared.paging.Paged;

import java.util.Optional;

public interface TalkStore {

    /** Everything, or one status when it is set; newest published first. */
    Paged<Talk> findAll(TalkStatus status, PageQuery page);

    Optional<Talk> findById(Long id);

    Talk save(Talk talk);

    void delete(Long id);
}
