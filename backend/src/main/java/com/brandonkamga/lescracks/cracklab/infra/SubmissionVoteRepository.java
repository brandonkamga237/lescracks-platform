package com.brandonkamga.lescracks.cracklab.infra;

import com.brandonkamga.lescracks.cracklab.domain.SubmissionVote;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface SubmissionVoteRepository extends JpaRepository<SubmissionVote, Long> {

    Optional<SubmissionVote> findBySubmissionIdAndUserId(Long submissionId, Long userId);

    List<SubmissionVote> findBySubmissionIdInAndUserId(Collection<Long> submissionIds, Long userId);

    /** The vote total is always recomputed from the votes themselves, so it cannot drift. */
    @Query("SELECT COALESCE(SUM(v.value), 0) FROM SubmissionVote v WHERE v.submission.id = :submissionId")
    long sumValues(@Param("submissionId") Long submissionId);
}
