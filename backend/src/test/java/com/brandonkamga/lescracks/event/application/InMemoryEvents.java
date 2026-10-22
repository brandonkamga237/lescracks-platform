package com.brandonkamga.lescracks.event.application;

import com.brandonkamga.lescracks.engagement.application.EngagementCounts;
import com.brandonkamga.lescracks.engagement.domain.model.Counts;
import com.brandonkamga.lescracks.engagement.domain.model.Target;
import com.brandonkamga.lescracks.engagement.domain.model.TargetType;
import com.brandonkamga.lescracks.event.domain.model.Event;
import com.brandonkamga.lescracks.event.domain.model.EventSearch;
import com.brandonkamga.lescracks.event.domain.model.EventStatus;
import com.brandonkamga.lescracks.event.domain.model.Registration;
import com.brandonkamga.lescracks.event.domain.model.Submission;
import com.brandonkamga.lescracks.event.domain.port.EventStore;
import com.brandonkamga.lescracks.event.domain.port.RegistrationStore;
import com.brandonkamga.lescracks.event.domain.port.SubmissionStore;
import com.brandonkamga.lescracks.member.application.Member;
import com.brandonkamga.lescracks.member.application.MemberDirectory;
import com.brandonkamga.lescracks.newsletter.application.Announcements;
import com.brandonkamga.lescracks.newsletter.application.ArticleNews;
import com.brandonkamga.lescracks.newsletter.application.EventNews;
import com.brandonkamga.lescracks.shared.exception.NotFoundException;
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
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.atomic.AtomicLong;
import java.util.stream.Collectors;

/** Copying fakes for event's stores and the modules it talks to, so tests read what was really saved or sent. */
final class InMemoryEvents {

    private InMemoryEvents() {
    }

    static final class Events implements EventStore {
        private final Map<Long, Event> rows = new LinkedHashMap<>();
        private final AtomicLong ids = new AtomicLong(1);

        Event stored(Long id) {
            return rows.get(id).toBuilder().build();
        }

        Event add(Event event) {
            return save(event);
        }

        void shift(Long id, int delta) {
            Event event = rows.get(id);
            event.setRegistrationCount(Math.max(0, event.getRegistrationCount() + delta));
        }

        @Override
        public Optional<Event> findById(Long id) {
            return Optional.ofNullable(rows.get(id)).map(event -> event.toBuilder().build());
        }

        @Override
        public Optional<Event> findBySlug(String slug) {
            return rows.values().stream().filter(event -> slug.equals(event.getSlug())).findFirst().map(event -> event.toBuilder().build());
        }

        @Override
        public boolean slugTaken(String slug) {
            return findBySlug(slug).isPresent();
        }

        @Override
        public Paged<Event> search(EventSearch search, PageQuery page, Instant now) {
            Comparator<Event> byStart = Comparator.comparing(Event::getStartDate);
            List<Event> found = rows.values().stream()
                    .filter(event -> search.status() == null || event.getStatus() == search.status())
                    .filter(event -> search.type() == null || event.getType() == search.type())
                    .filter(event -> search.format() == null || event.getFormat() == search.format())
                    .filter(event -> switch (search.timing()) {
                        case ANY -> true;
                        case UPCOMING -> event.getStartDate().isAfter(now) || (event.getEndDate() != null && event.getEndDate().isAfter(now));
                        case PAST -> !event.getStartDate().isAfter(now) && (event.getEndDate() == null || !event.getEndDate().isAfter(now));
                    })
                    .sorted(search.newestFirst() ? byStart.reversed() : byStart)
                    .map(event -> event.toBuilder().build()).toList();
            int from = Math.min(found.size(), page.page() * page.size());
            return new Paged<>(found.subList(from, Math.min(found.size(), from + page.size())), page.page(), page.size(), found.size());
        }

        @Override
        public List<Event> findAllById(Collection<Long> ids) {
            return ids.stream().map(rows::get).filter(Objects::nonNull).map(event -> event.toBuilder().build()).toList();
        }

        @Override
        public List<Long> findScheduledIds(Instant now) {
            return rows.values().stream().filter(event -> event.getStatus() == EventStatus.DRAFT && event.getScheduledAt() != null
                    && !event.getScheduledAt().isAfter(now)).map(Event::getId).toList();
        }

        @Override
        public Event save(Event event) {
            Event stored = event.toBuilder().id(event.getId() == null ? ids.getAndIncrement() : event.getId()).build();
            // Mirrors the SQL adapter: a save never writes the registration counter.
            stored.setRegistrationCount(rows.containsKey(stored.getId()) ? rows.get(stored.getId()).getRegistrationCount() : 0);
            rows.put(stored.getId(), stored);
            return stored.toBuilder().build();
        }

        @Override
        public void delete(Long id) {
            rows.remove(id);
        }
    }

    static final class Registrations implements RegistrationStore {
        private final Map<Long, Registration> rows = new LinkedHashMap<>();
        private final AtomicLong ids = new AtomicLong(1);
        private final Events events;

        Registrations(Events events) {
            this.events = events;
        }

        List<Registration> all() {
            return rows.values().stream().map(registration -> registration.toBuilder().build()).toList();
        }

        @Override
        public Optional<Registration> findById(Long id) {
            return Optional.ofNullable(rows.get(id)).map(registration -> registration.toBuilder().build());
        }

        @Override
        public Optional<Registration> find(Long eventId, Long userId) {
            return rows.values().stream().filter(r -> r.getEventId().equals(eventId) && r.getUserId().equals(userId)).findFirst()
                    .map(registration -> registration.toBuilder().build());
        }

        @Override
        public List<Registration> findByEvent(Long eventId) {
            return rows.values().stream().filter(r -> r.getEventId().equals(eventId)).map(r -> r.toBuilder().build()).toList();
        }

        @Override
        public List<Registration> findActiveByMember(Long userId) {
            return rows.values().stream().filter(r -> r.getUserId().equals(userId) && r.isActive())
                    .sorted(Comparator.comparing((Registration r) -> events.stored(r.getEventId()).getStartDate()).reversed())
                    .map(r -> r.toBuilder().build()).toList();
        }

        @Override
        public Registration save(Registration registration) {
            if (registration.getId() == null && find(registration.getEventId(), registration.getUserId()).isPresent()) {
                throw new IllegalStateException("event_registrations_once");
            }
            Registration stored = registration.toBuilder().id(registration.getId() == null ? ids.getAndIncrement() : registration.getId()).build();
            rows.put(stored.getId(), stored);
            return stored.toBuilder().build();
        }

        @Override
        public void shiftCount(Long eventId, int delta) {
            events.shift(eventId, delta);
        }
    }

    static final class Submissions implements SubmissionStore {
        private final Map<Long, Submission> rows = new LinkedHashMap<>();
        private final AtomicLong ids = new AtomicLong(1);

        Submission stored(Long id) {
            return copy(rows.get(id));
        }

        private static Submission copy(Submission submission) {
            return submission.toBuilder().memberIds(new LinkedHashSet<>(submission.getMemberIds())).build();
        }

        @Override
        public Optional<Submission> findById(Long id) {
            return Optional.ofNullable(rows.get(id)).map(Submissions::copy);
        }

        @Override
        public Optional<Submission> findByMember(Long eventId, Long userId) {
            return rows.values().stream().filter(s -> s.getEventId().equals(eventId) && s.getMemberIds().contains(userId))
                    .findFirst().map(Submissions::copy);
        }

        @Override
        public Set<Long> findTaken(Long eventId, Collection<Long> userIds, Long exceptSubmissionId) {
            return rows.values().stream().filter(s -> s.getEventId().equals(eventId) && !s.getId().equals(exceptSubmissionId))
                    .flatMap(s -> s.getMemberIds().stream()).filter(userIds::contains).collect(Collectors.toSet());
        }

        @Override
        public List<Submission> findByEvent(Long eventId) {
            return rows.values().stream().filter(s -> s.getEventId().equals(eventId))
                    .sorted(Comparator.comparing((Submission s) -> s.getRank() == null ? 99 : s.getRank()))
                    .map(Submissions::copy).toList();
        }

        @Override
        public Submission save(Submission submission) {
            Submission stored = copy(submission).toBuilder().id(submission.getId() == null ? ids.getAndIncrement() : submission.getId()).build();
            Set<Long> taken = findTaken(stored.getEventId(), stored.getMemberIds(), stored.getId());
            if (!taken.isEmpty()) throw new IllegalStateException("event_submission_members_once");
            rows.put(stored.getId(), stored);
            return copy(stored);
        }
    }

    static final class People implements MemberDirectory {
        private final Map<Long, Member> byId = new LinkedHashMap<>();
        final List<Collection<Long>> lookups = new ArrayList<>();

        Member add(Long id, String email, String firstName) {
            Member member = Member.builder().id(id).email(email).firstName(firstName).lastName("L").active(true).build();
            byId.put(id, member);
            return member;
        }

        @Override
        public Optional<Member> find(String email) {
            return byId.values().stream().filter(member -> member.getEmail().equalsIgnoreCase(email)).findFirst();
        }

        @Override
        public Member require(String email) {
            return find(email).orElseThrow(() -> new NotFoundException("Member", "email", email));
        }

        @Override
        public Member require(Long id) {
            return Optional.ofNullable(byId.get(id)).orElseThrow(() -> new NotFoundException("Member", "id", id));
        }

        @Override
        public Map<Long, Member> findAll(Collection<Long> ids) {
            lookups.add(new HashSet<>(ids));
            Map<Long, Member> found = new HashMap<>();
            ids.forEach(id -> { if (byId.containsKey(id)) found.put(id, byId.get(id)); });
            return found;
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
        final List<EventNews> events = new ArrayList<>();

        @Override
        public void announceEvent(EventNews news) {
            events.add(news);
        }

        @Override
        public void announceArticle(ArticleNews news) {
        }
    }

    static final class Files implements StorageService {
        final List<String> deleted = new ArrayList<>();

        @Override
        public String store(String originalName, byte[] content, String contentType) {
            return "key-" + originalName;
        }

        @Override
        public Optional<StoredObject> read(String key) {
            return Optional.empty();
        }

        @Override
        public void delete(String key) {
            deleted.add(key);
        }

        @Override
        public boolean reachable() {
            return true;
        }
    }
}
