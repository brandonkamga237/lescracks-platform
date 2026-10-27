package com.brandonkamga.lescracks.engagement.application;

import com.brandonkamga.lescracks.engagement.domain.model.Comment;
import com.brandonkamga.lescracks.engagement.domain.model.CommentStatus;
import com.brandonkamga.lescracks.engagement.domain.model.Counts;
import com.brandonkamga.lescracks.engagement.domain.model.Target;
import com.brandonkamga.lescracks.engagement.domain.model.TargetType;
import com.brandonkamga.lescracks.engagement.domain.port.CommentStore;
import com.brandonkamga.lescracks.engagement.domain.port.ReactionStore;
import com.brandonkamga.lescracks.engagement.domain.port.ReportStore;
import com.brandonkamga.lescracks.shared.paging.PageQuery;
import com.brandonkamga.lescracks.shared.paging.Paged;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.atomic.AtomicLong;

/** Copying fakes for engagement's three stores, so tests read what was really saved. */
final class InMemoryEngagement {

    private InMemoryEngagement() {
    }

    static final class Comments implements CommentStore {
        private final Map<Long, Comment> rows = new LinkedHashMap<>();
        private final AtomicLong ids = new AtomicLong(100);

        Comment stored(Long id) {
            return findById(id).orElseThrow();
        }

        @Override
        public Optional<Comment> findById(Long id) {
            return Optional.ofNullable(rows.get(id)).map(row -> row.toBuilder().build());
        }

        @Override
        public List<Comment> findByTarget(Target target) {
            return rows.values().stream().filter(row -> row.target().equals(target))
                    .sorted(Comparator.comparing(Comment::getId)).map(row -> row.toBuilder().build()).toList();
        }

        @Override
        public long countByAuthorSince(Long authorId, Instant since) {
            return rows.values().stream().filter(row -> row.getAuthorId().equals(authorId) && row.getCreatedAt().isAfter(since)).count();
        }

        @Override
        public Paged<Comment> findForModeration(boolean reportedOnly, PageQuery page) {
            List<Comment> all = rows.values().stream().filter(row -> row.getStatus() != CommentStatus.DELETED)
                    .filter(row -> !reportedOnly || row.getReportCount() > 0).map(row -> row.toBuilder().build()).toList();
            return new Paged<>(all, page.page(), page.size(), all.size());
        }

        @Override
        public Comment save(Comment comment) {
            Comment row = comment.toBuilder().build();
            if (row.getId() == null) row.setId(ids.incrementAndGet());
            rows.put(row.getId(), row);
            return row.toBuilder().build();
        }

        @Override
        public void delete(Long id) {
            rows.remove(id);
        }

        @Override
        public void deleteByTarget(Target target) {
            rows.values().removeIf(row -> row.target().equals(target));
        }
    }

    static final class Reports implements ReportStore {
        private final Map<Long, List<String>> reasons = new HashMap<>();
        private final Set<String> pairs = new HashSet<>();

        @Override
        public boolean exists(Long commentId, Long reporterId) {
            return pairs.contains(commentId + "/" + reporterId);
        }

        @Override
        public void add(Long commentId, Long reporterId, String reason) {
            pairs.add(commentId + "/" + reporterId);
            if (reason != null) reasons.computeIfAbsent(commentId, id -> new ArrayList<>()).add(0, reason);
        }

        @Override
        public Map<Long, List<String>> reasonsOf(Collection<Long> commentIds) {
            Map<Long, List<String>> found = new HashMap<>();
            commentIds.forEach(id -> { if (reasons.containsKey(id)) found.put(id, List.copyOf(reasons.get(id))); });
            return found;
        }
    }

    static final class Reactions implements ReactionStore {
        private final Set<String> views = new HashSet<>();
        private final Set<String> likes = new HashSet<>();

        @Override
        public boolean addView(Target target, String visitorKey) {
            return views.add(target + "/" + visitorKey);
        }

        @Override
        public boolean addLike(Target target, Long accountId) {
            return likes.add(target + "/" + accountId);
        }

        @Override
        public boolean removeLike(Target target, Long accountId) {
            return likes.remove(target + "/" + accountId);
        }

        @Override
        public boolean hasLiked(Target target, Long accountId) {
            return likes.contains(target + "/" + accountId);
        }

        @Override
        public Counts counts(Target target) {
            String prefix = target + "/";
            return new Counts((int) views.stream().filter(v -> v.startsWith(prefix)).count(),
                    (int) likes.stream().filter(l -> l.startsWith(prefix)).count());
        }

        @Override
        public Map<Long, Counts> counts(TargetType type, Collection<Long> ids) {
            Map<Long, Counts> found = new HashMap<>();
            ids.forEach(id -> {
                Counts counts = counts(new Target(type, id));
                if (!counts.equals(Counts.NONE)) found.put(id, counts);
            });
            return found;
        }

        @Override
        public Map<Long, Counts> mostLiked(TargetType type, int limit) {
            Map<Long, Counts> ranked = new LinkedHashMap<>();
            likes.stream().filter(l -> l.startsWith("Target[type=" + type + ","))
                    .map(l -> Long.valueOf(l.substring(l.indexOf("id=") + 3, l.indexOf(']'))))
                    .distinct().map(id -> Map.entry(id, counts(new Target(type, id))))
                    .sorted((a, b) -> Integer.compare(b.getValue().likes(), a.getValue().likes())).limit(limit)
                    .forEach(entry -> ranked.put(entry.getKey(), entry.getValue()));
            return ranked;
        }

        @Override
        public void releaseLikesOf(Long accountId) {
            // Like counts are derived from the likes here, so there is no separate counter to correct.
        }

        @Override
        public void forget(Target target) {
            views.removeIf(v -> v.startsWith(target + "/"));
            likes.removeIf(l -> l.startsWith(target + "/"));
        }
    }

    /** One article (7) published, one (8) a draft; pages under /blog. */
    static TargetRegistry articles() {
        return new TargetRegistry(List.of(new ContentTargets() {
            @Override
            public TargetType type() {
                return TargetType.ARTICLE;
            }

            @Override
            public boolean isOpen(Long id) {
                return id == 7L;
            }

            @Override
            public Map<Long, TargetPage> describe(Collection<Long> ids) {
                Map<Long, TargetPage> pages = new HashMap<>();
                ids.forEach(id -> pages.put(id, new TargetPage(id, "Docker sans peur", "/blog/docker-sans-peur")));
                return pages;
            }
        }));
    }
}
