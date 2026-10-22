package com.brandonkamga.lescracks.event.infra.persistence;

import com.brandonkamga.lescracks.event.domain.model.Submission;
import com.brandonkamga.lescracks.event.domain.model.SubmissionStatus;
import com.brandonkamga.lescracks.event.domain.port.SubmissionStore;

import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Component;

import java.util.Collection;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

import static com.brandonkamga.lescracks.shared.persistence.JdbcValues.at;
import static com.brandonkamga.lescracks.shared.persistence.JdbcValues.enumOf;
import static com.brandonkamga.lescracks.shared.persistence.JdbcValues.instant;

@Component
class JdbcSubmissionStore implements SubmissionStore {

    private static final String COLUMNS = """
            s.id, s.event_id, s.owner_id, s.title, s.repository_url, s.demo_url, s.description, s.status, s.score, s.rank,
            s.review_note, s.submitted_at, s.updated_at""";

    private static final RowMapper<Submission> ROW = (row, number) -> Submission.builder()
            .id(row.getLong("id"))
            .eventId(row.getLong("event_id"))
            .ownerId(row.getLong("owner_id"))
            .title(row.getString("title"))
            .repositoryUrl(row.getString("repository_url"))
            .demoUrl(row.getString("demo_url"))
            .description(row.getString("description"))
            .status(enumOf(row, "status", SubmissionStatus.class))
            .score((Integer) row.getObject("score"))
            .rank((Integer) row.getObject("rank"))
            .reviewNote(row.getString("review_note"))
            .submittedAt(instant(row, "submitted_at"))
            .updatedAt(instant(row, "updated_at"))
            .build();

    private final JdbcClient jdbc;

    JdbcSubmissionStore(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public Optional<Submission> findById(Long id) {
        return withMembers(jdbc.sql("SELECT " + COLUMNS + " FROM event_submissions s WHERE s.id = :id").param("id", id).query(ROW).list())
                .stream().findFirst();
    }

    @Override
    public Optional<Submission> findByMember(Long eventId, Long userId) {
        return withMembers(jdbc.sql("SELECT " + COLUMNS + """
                         FROM event_submissions s JOIN event_submission_members m ON m.submission_id = s.id
                        WHERE m.event_id = :event AND m.user_id = :user""")
                .param("event", eventId).param("user", userId).query(ROW).list()).stream().findFirst();
    }

    @Override
    public Set<Long> findTaken(Long eventId, Collection<Long> userIds, Long exceptSubmissionId) {
        if (userIds.isEmpty()) return Set.of();
        return new HashSet<>(jdbc.sql("""
                        SELECT user_id FROM event_submission_members
                        WHERE event_id = :event AND user_id IN (:users) AND submission_id IS DISTINCT FROM CAST(:except AS BIGINT)""")
                .param("event", eventId).param("users", userIds).param("except", exceptSubmissionId)
                .query(Long.class).list());
    }

    @Override
    public List<Submission> findByEvent(Long eventId) {
        return withMembers(jdbc.sql("SELECT " + COLUMNS + """
                         FROM event_submissions s WHERE s.event_id = :event
                        ORDER BY coalesce(s.rank, 99), s.score DESC NULLS LAST, s.submitted_at""")
                .param("event", eventId).query(ROW).list());
    }

    @Override
    public Submission save(Submission submission) {
        Long id = submission.getId();
        var statement = id == null
                ? jdbc.sql("""
                        INSERT INTO event_submissions (event_id, owner_id, title, repository_url, demo_url, description, status,
                                                       score, rank, review_note, submitted_at, updated_at)
                        VALUES (:event, :owner, :title, :repository, :demo, :description, :status, :score, :rank, :note,
                                :submittedAt, :updatedAt)
                        RETURNING id""").param("event", submission.getEventId()).param("owner", submission.getOwnerId())
                        .param("submittedAt", at(submission.getSubmittedAt()))
                : jdbc.sql("""
                        UPDATE event_submissions SET title = :title, repository_url = :repository, demo_url = :demo,
                               description = :description, status = :status, score = :score, rank = :rank, review_note = :note,
                               updated_at = :updatedAt
                        WHERE id = :id RETURNING id""").param("id", id);
        id = statement.param("title", submission.getTitle())
                .param("repository", submission.getRepositoryUrl())
                .param("demo", submission.getDemoUrl())
                .param("description", submission.getDescription())
                .param("status", submission.getStatus().name())
                .param("score", submission.getScore())
                .param("rank", submission.getRank())
                .param("note", submission.getReviewNote())
                .param("updatedAt", at(submission.getUpdatedAt()))
                .query(Long.class).single();
        saveMembers(id, submission.getEventId(), submission.getMemberIds());
        return submission.toBuilder().id(id).memberIds(new LinkedHashSet<>(submission.getMemberIds())).build();
    }

    /** Two statements whatever the size of the team: drop who left, add who came. */
    private void saveMembers(Long submissionId, Long eventId, Set<Long> memberIds) {
        Long[] ids = memberIds.toArray(Long[]::new);
        jdbc.sql("DELETE FROM event_submission_members WHERE submission_id = :submission AND NOT (user_id = ANY(:ids))")
                .param("submission", submissionId).param("ids", ids).update();
        if (ids.length == 0) return;
        jdbc.sql("""
                        INSERT INTO event_submission_members (submission_id, event_id, user_id)
                        SELECT :submission, :event, unnest(:ids) ON CONFLICT (submission_id, user_id) DO NOTHING""")
                .param("submission", submissionId).param("event", eventId).param("ids", ids).update();
    }

    /** The teams of every submission in one query; the owner comes first. */
    private List<Submission> withMembers(List<Submission> submissions) {
        if (submissions.isEmpty()) return submissions;
        Map<Long, Submission> byId = new HashMap<>();
        submissions.forEach(submission -> {
            submission.getMemberIds().add(submission.getOwnerId());
            byId.put(submission.getId(), submission);
        });
        jdbc.sql("SELECT submission_id, user_id FROM event_submission_members WHERE submission_id IN (:ids) ORDER BY user_id")
                .param("ids", byId.keySet())
                .query(row -> { byId.get(row.getLong("submission_id")).getMemberIds().add(row.getLong("user_id")); });
        return submissions;
    }
}
