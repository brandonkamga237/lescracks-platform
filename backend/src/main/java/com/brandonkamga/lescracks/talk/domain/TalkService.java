package com.brandonkamga.lescracks.talk.domain;

import com.brandonkamga.lescracks.talk.api.dto.TalkRequest;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface TalkService {

    Page<TalkVideo> published(Pageable pageable);

    Page<TalkVideo> all(Pageable pageable);

    TalkVideo require(Long id);

    TalkVideo create(TalkRequest request);

    TalkVideo update(Long id, TalkRequest request);

    void delete(Long id);
}
