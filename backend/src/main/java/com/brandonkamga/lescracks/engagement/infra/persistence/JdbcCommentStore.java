package com.brandonkamga.lescracks.engagement.infra.persistence;

import com.brandonkamga.lescracks.engagement.domain.model.Comment;
import com.brandonkamga.lescracks.engagement.domain.model.CommentStatus;
import com.brandonkamga.lescracks.engagement.domain.model.Target;
import com.brandonkamga.lescracks.engagement.domain.model.TargetType;
import com.brandonkamga.lescracks.engagement.domain.port.CommentStore;
import com.brandonkamga.lescracks.shared.paging.PageQuery;
import com.brandonkamga.lescracks.shared.paging.Paged;

import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static com.brandonkamga.lescracks.shared.persistence.JdbcValues.at;
import static com.brandonkamga.lescracks.shared.persistence.JdbcValues.enumOf;
import static com.brandonkamga.lescracks.shared.persistence.JdbcValues.instant;
import static com.brandonkamga.lescracks.shared.persistence.JdbcValues.longOrNull;

@Component
class JdbcCommentStore implements CommentStore {

    private static final String COLUMNS = "id, target_type, target_id, author_id, parent_id, body, status, report_count, created_at, edited_at";

    private static final RowMapper<Comment> ROW = (row, number) -> Comment.builder()
            .id(row.getLong("id"))
            .targetType(enumOf(row, "target_type", TargetType.class))
            .targetId(row.getLong("target_id"))
            .authorId(row.getLong("author_id"))
            .parentId(longOrNull(row, "parent_id"))
            .body(row.getString("body"))
            .status(enumOf(row, "status", CommentStatus.class))
            .reportCount(row.getInt("report_count"))
            .createdAt(instant(row, "created_at"))
            .editedAt(instant(row, "edited_at"))
            .build();

    private final JdbcClient jdbc;

    JdbcCommentStore(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public Optional<Comment> findById(Long id) {
        return jdbc.sql("SELECT " + COLUMNS + " FROM comments WHERE id = :id").param("id", id).query(ROW).optional();
    }

    @Override
    public List<Comment> findByTarget(Target target) {
        // Served by comments_target_idx.
        return jdbc.sql("SELECT " + COLUMNS + " FROM comments WHERE target_type = :type AND target_id = :id ORDER BY created_at, id")
                .param("type", target.type().name()).param("id", target.id()).query(ROW).list();
    }

    @Override
    public long countByAuthorSince(Long authorId, Instant since) {
        return jdbc.sql("SELECT count(*) FROM comments WHERE author_id = :author AND created_at > :since")
                .param("author", authorId).param("since", at(since)).query(Long.class).single();
    }

    @Override
    public Paged<Comment> findForModeration(boolean reportedOnly, PageQuery page) {
        String where = reportedOnly ? "status <> 'DELETED' AND report_count > 0" : "status <> 'DELETED'";
        String order = reportedOnly ? "report_count DESC, created_at DESC, id DESC" : "created_at DESC, id DESC";
        List<Long> totals = new ArrayList<>();
        List<Comment> found = jdbc.sql("SELECT " + COLUMNS + ", count(*) OVER () AS total FROM comments WHERE " + where
                        + " ORDER BY " + order + " LIMIT :limit OFFSET :offset")
                .param("limit", page.size()).param("offset", (long) page.page() * page.size())
                .query((row, number) -> {
                    if (number == 0) totals.add(row.getLong("total"));
                    return ROW.mapRow(row, number);
                }).list();
        long total = !totals.isEmpty() ? totals.get(0) : page.page() == 0 ? 0
                : jdbc.sql("SELECT count(*) FROM comments WHERE " + where).query(Long.class).single();
        return new Paged<>(found, page.page(), page.size(), total);
    }

    @Override
    public Comment save(Comment comment) {
        if (comment.getId() == null) {
            Long id = jdbc.sql("""
                    INSERT INTO comments (target_type, target_id, author_id, parent_id, body, status, report_count, created_at, edited_at)
                    VALUES (:type, :target, :author, :parent, :body, :status, :reports, :createdAt, :editedAt) RETURNING id""")
                    .param("type", comment.getTargetType().name())
                    .param("target", comment.getTargetId())
                    .param("author", comment.getAuthorId())
                    .param("parent", comment.getParentId())
                    .param("body", comment.getBody())
                    .param("status", comment.getStatus().name())
                    .param("reports", comment.getReportCount())
                    .param("createdAt", at(comment.getCreatedAt()))
                    .param("editedAt", at(comment.getEditedAt()))
                    .query(Long.class).single();
            return comment.toBuilder().id(id).build();
        }
        jdbc.sql("UPDATE comments SET body = :body, status = :status, report_count = :reports, edited_at = :editedAt WHERE id = :id")
                .param("body", comment.getBody())
                .param("status", comment.getStatus().name())
                .param("reports", comment.getReportCount())
                .param("editedAt", at(comment.getEditedAt()))
                .param("id", comment.getId())
                .update();
        return comment.toBuilder().build();
    }

    @Override
    public void delete(Long id) {
        jdbc.sql("DELETE FROM comments WHERE id = :id").param("id", id).update();
    }

    @Override
    public void deleteByTarget(Target target) {
        jdbc.sql("DELETE FROM comments WHERE target_type = :type AND target_id = :id")
                .param("type", target.type().name()).param("id", target.id()).update();
    }
}
