package com.brandonkamga.lescracks.cracklab.infra;

import com.brandonkamga.lescracks.cracklab.domain.Submission;
import com.brandonkamga.lescracks.cracklab.domain.SubmissionStatus;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface SubmissionRepository extends JpaRepository<Submission, Long> {

    Optional<Submission> findByChallengeIdAndUserId(Long challengeId, Long userId);

    boolean existsByChallengeIdAndUserId(Long challengeId, Long userId);

    boolean existsByChallengeIdAndStatus(Long challengeId, SubmissionStatus status);

    long countByChallengeId(Long challengeId);

    long countByChallengeIdAndStatus(Long challengeId, SubmissionStatus status);

    /** Graded answers first, best score first; pending ones after, oldest first. */
    @Query("""
            SELECT s FROM Submission s
            WHERE s.challenge.id = :challengeId
            ORDER BY CASE WHEN s.status = com.brandonkamga.lescracks.cracklab.domain.SubmissionStatus.GRADED THEN 0 ELSE 1 END,
                     s.technicalScore DESC NULLS LAST, s.createdAt ASC
            """)
    List<Submission> findForChallenge(@Param("challengeId") Long challengeId);

    List<Submission> findByUserIdOrderByCreatedAtDesc(Long userId);

    @Query("""
            SELECT s FROM Submission s
            WHERE (:status IS NULL OR s.status = :status)
              AND (:challengeId IS NULL OR s.challenge.id = :challengeId)
            """)
    Page<Submission> searchForAdmin(@Param("status") SubmissionStatus status,
                                    @Param("challengeId") Long challengeId,
                                    Pageable pageable);

    /**
     * The global ranking: total technical score over graded submissions. On a tie, fewer
     * challenges ranks higher (same points, better average), then the earlier member.
     */
    @Query(value = """
            SELECT s.user.id AS userId, s.user.firstName AS firstName, s.user.lastName AS lastName,
                   s.user.username AS username, s.user.avatarUrl AS avatarUrl,
                   SUM(s.technicalScore) AS totalScore, COUNT(s) AS challenges
            FROM Submission s
            WHERE s.status = com.brandonkamga.lescracks.cracklab.domain.SubmissionStatus.GRADED
            GROUP BY s.user.id, s.user.firstName, s.user.lastName, s.user.username, s.user.avatarUrl
            ORDER BY SUM(s.technicalScore) DESC, COUNT(s) ASC, s.user.id ASC
            """,
            countQuery = """
            SELECT COUNT(DISTINCT s.user.id) FROM Submission s
            WHERE s.status = com.brandonkamga.lescracks.cracklab.domain.SubmissionStatus.GRADED
            """)
    Page<RankingRow> ranking(Pageable pageable);

    interface RankingRow {
        Long getUserId();
        String getFirstName();
        String getLastName();
        String getUsername();
        String getAvatarUrl();
        Long getTotalScore();
        Long getChallenges();
    }
}
