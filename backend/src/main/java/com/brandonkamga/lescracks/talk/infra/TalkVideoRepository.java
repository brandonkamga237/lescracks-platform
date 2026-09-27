package com.brandonkamga.lescracks.talk.infra;

import com.brandonkamga.lescracks.talk.domain.TalkStatus;
import com.brandonkamga.lescracks.talk.domain.TalkVideo;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TalkVideoRepository extends JpaRepository<TalkVideo, Long> {

    Page<TalkVideo> findByStatusOrderByPublishedAtDesc(TalkStatus status, Pageable pageable);

    long countByStatus(TalkStatus status);
}
