package com.brandonkamga.lescracks.cracklab.domain;

import com.brandonkamga.lescracks.cracklab.infra.SubmissionRepository;
import com.brandonkamga.lescracks.identity.domain.User;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.Instant;
import java.util.Map;

public interface ProgressService {

    MemberProgress of(User member);

    /** Only members who have answered at least once have a public profile. */
    MemberProgress publicProfile(Long memberId);

    ChallengeStats statsFor(Long challengeId);

    PublicResult result(Long submissionId);

    Page<SubmissionRepository.RankingRow> weekRanking(Pageable pageable);

    Instant weekStart();

    /** All-time XP per member id, for levels on the weekly board. */
    Map<Long, Long> allTimeXp();
}
