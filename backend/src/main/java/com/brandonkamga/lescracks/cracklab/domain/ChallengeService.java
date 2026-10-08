package com.brandonkamga.lescracks.cracklab.domain;

import com.brandonkamga.lescracks.cracklab.api.dto.ChallengeRequest;
import com.brandonkamga.lescracks.shared.scheduling.ScheduledPublishing;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ChallengeService extends ScheduledPublishing {

    Page<Challenge> published(ChallengeDifficulty difficulty, String category, String tag, Pageable pageable);

    Challenge requirePublished(String slug);

    Page<Challenge> all(Pageable pageable);

    Challenge require(Long id);

    Challenge create(ChallengeRequest request, String adminUsername);

    Challenge update(Long id, ChallengeRequest request);

    void delete(Long id);

    long submissionCount(Long challengeId);

    long pendingCount(Long challengeId);

    boolean gradingLocked(Long challengeId);
}
