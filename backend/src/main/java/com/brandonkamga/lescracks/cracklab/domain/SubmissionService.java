package com.brandonkamga.lescracks.cracklab.domain;

import com.brandonkamga.lescracks.cracklab.api.dto.GradeRequest;
import com.brandonkamga.lescracks.cracklab.infra.SubmissionRepository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Optional;

public interface SubmissionService {

    Submission submit(String challengeSlug, String email, String answer);

    /** The viewer's submission to a challenge, if they are a member and have answered. */
    Optional<Submission> mine(Long challengeId, String email);

    /** Every answer to a challenge; only for a member who has answered it. */
    List<Submission> forChallenge(String challengeSlug, String email);

    List<Submission> mineAll(String email);

    Submission grade(Long submissionId, GradeRequest request, String adminUsername);

    VoteResult vote(Long submissionId, String email, int value);

    Map<Long, Integer> myVotes(Collection<Long> submissionIds, String email);

    Page<SubmissionRepository.RankingRow> ranking(Pageable pageable);

    Optional<Long> memberId(String email);

    Page<Submission> forAdmin(SubmissionStatus status, Long challengeId, Pageable pageable);

    Submission require(Long id);
}
