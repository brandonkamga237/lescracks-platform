package com.brandonkamga.lescracks.content.application;

import com.brandonkamga.lescracks.content.domain.model.Article;
import com.brandonkamga.lescracks.content.domain.model.ArticleSearch;
import com.brandonkamga.lescracks.content.domain.model.ArticleStatus;
import com.brandonkamga.lescracks.content.domain.model.Talk;
import com.brandonkamga.lescracks.content.domain.model.TalkStatus;
import com.brandonkamga.lescracks.content.domain.port.ArticleStore;
import com.brandonkamga.lescracks.content.domain.port.TalkStore;
import com.brandonkamga.lescracks.engagement.application.EngagementCounts;
import com.brandonkamga.lescracks.engagement.domain.model.Counts;
import com.brandonkamga.lescracks.engagement.domain.model.Target;
import com.brandonkamga.lescracks.engagement.domain.model.TargetType;
import com.brandonkamga.lescracks.newsletter.application.Announcements;
import com.brandonkamga.lescracks.newsletter.application.ArticleNews;
import com.brandonkamga.lescracks.newsletter.application.EventNews;
import com.brandonkamga.lescracks.shared.paging.PageQuery;
import com.brandonkamga.lescracks.shared.paging.Paged;
import com.brandonkamga.lescracks.storage.domain.StorageService;

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
import java.util.TreeMap;
import java.util.concurrent.atomic.AtomicLong;
import java.util.stream.Collectors;

/** Copying fakes for content's stores and the modules it talks to, so tests read what was really saved or sent. */
final class InMemoryContent {

    private InMemoryContent() {
    }

    private static <T> Paged<T> page(List<T> all, PageQuery page) {
        int from = Math.min(all.size(), page.page() * page.size());
        return new Paged<>(all.subList(from, Math.min(all.size(), from + page.size())), page.page(), page.size(), all.size());
    }

    static final class Articles implements ArticleStore {
        private final Map<Long, Article> rows = new LinkedHashMap<>();
        private final AtomicLong ids = new AtomicLong(1);

        Article stored(Long id) {
            return copy(rows.get(id));
        }

        int size() {
            return rows.size();
        }

        private static Article copy(Article article) {
            return article == null ? null : article.toBuilder().tagIds(new HashSet<>(article.getTagIds())).build();
        }

        private static Article card(Article article) {
            return copy(article).toBuilder().body(null).plainText(null).build();
        }

        @Override
        public Optional<Article> findById(Long id) {
            return Optional.ofNullable(copy(rows.get(id)));
        }

        @Override
        public Optional<Article> findBySlug(String slug) {
            return rows.values().stream().filter(article -> slug.equals(article.getSlug())).findFirst().map(Articles::copy);
        }

        @Override
        public boolean slugTaken(String slug) {
            return findBySlug(slug).isPresent();
        }

        @Override
        public Paged<Article> search(ArticleSearch search, PageQuery page, boolean withBody) {
            List<Article> found = rows.values().stream()
                    .filter(article -> search.status() == null || article.getStatus() == search.status())
                    .filter(article -> search.categoryId() == null || search.categoryId().equals(article.getCategoryId()))
                    .filter(article -> search.tagId() == null || article.getTagIds().contains(search.tagId()))
                    .filter(article -> search.text() == null
                            || (article.getTitle() + " " + article.getDescription()).toLowerCase().contains(search.text().toLowerCase()))
                    .sorted(Comparator.comparing((Article article) -> search.order() == ArticleSearch.Order.CREATION || article.getPublishedAt() == null
                            ? article.getCreatedAt() : article.getPublishedAt()).reversed())
                    .map(article -> withBody ? copy(article) : card(article))
                    .toList();
            return page(found, page);
        }

        @Override
        public List<Article> findAllById(Collection<Long> ids) {
            return ids.stream().map(rows::get).filter(article -> article != null).map(Articles::card).toList();
        }

        @Override
        public List<Long> findScheduledIds(Instant now) {
            return rows.values().stream().filter(article -> article.getStatus() == ArticleStatus.DRAFT
                    && article.getScheduledAt() != null && !article.getScheduledAt().isAfter(now)).map(Article::getId).toList();
        }

        @Override
        public Map<Long, Long> countPublishedByCategory() {
            return rows.values().stream().filter(Article::isPublished)
                    .collect(Collectors.groupingBy(Article::getCategoryId, TreeMap::new, Collectors.counting()));
        }

        @Override
        public Article save(Article article) {
            Article stored = copy(article);
            if (stored.getId() == null) {
                stored.setId(ids.getAndIncrement());
            } else if (stored.getBody() == null && rows.containsKey(stored.getId())) {
                // Mirrors the SQL adapter: saving a card keeps the stored body.
                stored.setBody(rows.get(stored.getId()).getBody());
            }
            rows.put(stored.getId(), stored);
            return copy(stored);
        }

        @Override
        public void delete(Long id) {
            rows.remove(id);
        }
    }

    static final class Talks implements TalkStore {
        private final Map<Long, Talk> rows = new LinkedHashMap<>();
        private final AtomicLong ids = new AtomicLong(1);

        Talk stored(Long id) {
            return rows.get(id).toBuilder().build();
        }

        @Override
        public Paged<Talk> findAll(TalkStatus status, PageQuery page) {
            List<Talk> found = rows.values().stream().filter(talk -> status == null || talk.getStatus() == status)
                    .sorted(Comparator.comparing(Talk::getPublishedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                    .map(talk -> talk.toBuilder().build()).toList();
            return page(found, page);
        }

        @Override
        public Optional<Talk> findById(Long id) {
            return Optional.ofNullable(rows.get(id)).map(talk -> talk.toBuilder().build());
        }

        @Override
        public Talk save(Talk talk) {
            Talk stored = talk.toBuilder().id(talk.getId() == null ? ids.getAndIncrement() : talk.getId()).build();
            rows.put(stored.getId(), stored);
            return stored.toBuilder().build();
        }

        @Override
        public void delete(Long id) {
            rows.remove(id);
        }
    }

    static final class Engagement implements EngagementCounts {
        final Map<Target, Counts> counts = new HashMap<>();
        final List<Target> forgotten = new ArrayList<>();

        @Override
        public Counts countsOf(Target target) {
            return counts.getOrDefault(target, Counts.NONE);
        }

        @Override
        public Map<Long, Counts> countsOf(TargetType type, Collection<Long> ids) {
            return ids.stream().collect(Collectors.toMap(id -> id, id -> countsOf(new Target(type, id)), (a, b) -> a));
        }

        @Override
        public Map<Long, Counts> listMostLiked(TargetType type, int limit) {
            return Map.of();
        }

        @Override
        public void forget(Target target) {
            forgotten.add(target);
        }
    }

    static final class Newsletter implements Announcements {
        final List<ArticleNews> articles = new ArrayList<>();

        @Override
        public void announceEvent(EventNews news) {
        }

        @Override
        public void announceArticle(ArticleNews news) {
            articles.add(news);
        }
    }

    static final class Files implements StorageService {
        final Map<String, byte[]> stored = new LinkedHashMap<>();
        final List<String> deleted = new ArrayList<>();

        @Override
        public String store(String originalName, byte[] content, String contentType) {
            String key = "key-" + (stored.size() + 1) + "-" + originalName;
            stored.put(key, content);
            return key;
        }

        @Override
        public Optional<StoredObject> read(String key) {
            return Optional.empty();
        }

        @Override
        public void delete(String key) {
            deleted.add(key);
            stored.remove(key);
        }

        @Override
        public boolean reachable() {
            return true;
        }
    }
}
