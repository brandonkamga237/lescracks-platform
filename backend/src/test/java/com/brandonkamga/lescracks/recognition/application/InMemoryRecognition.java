package com.brandonkamga.lescracks.recognition.application;

import com.brandonkamga.lescracks.recognition.domain.model.Badge;
import com.brandonkamga.lescracks.recognition.domain.model.Certificate;
import com.brandonkamga.lescracks.recognition.domain.model.CertificateIssued;
import com.brandonkamga.lescracks.recognition.domain.model.CertificateStatus;
import com.brandonkamga.lescracks.recognition.domain.model.MemberBadge;
import com.brandonkamga.lescracks.recognition.domain.port.AwardStore;
import com.brandonkamga.lescracks.recognition.domain.port.BadgeStore;
import com.brandonkamga.lescracks.recognition.domain.port.CertificateStore;
import com.brandonkamga.lescracks.recognition.domain.port.RecognitionEvents;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.atomic.AtomicLong;
import java.util.stream.Collectors;

/** Copying fakes for recognition's stores, so tests read what was really saved. */
final class InMemoryRecognition {

    private InMemoryRecognition() {
    }

    static final class Badges implements BadgeStore {
        private final Map<Long, Badge> rows = new LinkedHashMap<>();
        private final AtomicLong ids = new AtomicLong(1);
        Awards awards;

        @Override
        public List<Badge> findAll() {
            return rows.values().stream().sorted(Comparator.comparing(Badge::isSystem).reversed().thenComparing(Badge::getName))
                    .map(badge -> badge.toBuilder().build()).toList();
        }

        @Override
        public Optional<Badge> findById(Long id) {
            return Optional.ofNullable(rows.get(id)).map(badge -> badge.toBuilder().build());
        }

        @Override
        public Optional<Badge> findByCode(String code) {
            return rows.values().stream().filter(badge -> badge.getCode().equals(code)).findFirst().map(badge -> badge.toBuilder().build());
        }

        @Override
        public boolean codeTaken(String code) {
            return findByCode(code).isPresent();
        }

        @Override
        public Badge save(Badge badge) {
            Badge stored = badge.toBuilder().id(badge.getId() == null ? ids.getAndIncrement() : badge.getId()).build();
            rows.put(stored.getId(), stored);
            return stored.toBuilder().build();
        }

        @Override
        public void delete(Long id) {
            rows.remove(id);
        }

        @Override
        public Map<Long, Long> countHolders() {
            return awards.rows.values().stream().collect(Collectors.groupingBy(award -> award.getBadge().getId(), Collectors.counting()));
        }
    }

    static final class Awards implements AwardStore {
        private final Map<Long, MemberBadge> rows = new LinkedHashMap<>();
        private final AtomicLong ids = new AtomicLong(1);

        int size() {
            return rows.size();
        }

        @Override
        public Optional<MemberBadge> find(Long badgeId, Long userId) {
            return rows.values().stream().filter(a -> a.getBadge().getId().equals(badgeId) && a.getUserId().equals(userId)).findFirst()
                    .map(a -> a.toBuilder().build());
        }

        @Override
        public List<MemberBadge> findByUser(Long userId) {
            return rows.values().stream().filter(a -> a.getUserId().equals(userId)).map(a -> a.toBuilder().build()).toList();
        }

        @Override
        public List<MemberBadge> findByBadge(Long badgeId) {
            return rows.values().stream().filter(a -> a.getBadge().getId().equals(badgeId)).map(a -> a.toBuilder().build()).toList();
        }

        @Override
        public MemberBadge add(MemberBadge award) {
            return find(award.getBadge().getId(), award.getUserId()).orElseGet(() -> {
                MemberBadge stored = award.toBuilder().id(ids.getAndIncrement()).build();
                rows.put(stored.getId(), stored);
                return stored.toBuilder().build();
            });
        }

        @Override
        public Set<Long> addAll(Badge badge, Collection<Long> userIds, String reason) {
            Set<Long> added = new LinkedHashSet<>();
            for (Long userId : userIds) {
                if (find(badge.getId(), userId).isPresent()) continue;
                add(MemberBadge.builder().badge(badge).userId(userId).reason(reason).build());
                added.add(userId);
            }
            return added;
        }

        @Override
        public void delete(Long badgeId, Long userId) {
            rows.values().removeIf(a -> a.getBadge().getId().equals(badgeId) && a.getUserId().equals(userId));
        }
    }

    static final class Certificates implements CertificateStore {
        private final Map<Long, Certificate> rows = new LinkedHashMap<>();
        private final AtomicLong ids = new AtomicLong(1);

        List<Certificate> all() {
            return rows.values().stream().map(c -> c.toBuilder().build()).toList();
        }

        Certificate add(Certificate certificate) {
            Certificate stored = certificate.toBuilder().id(ids.getAndIncrement()).build();
            rows.put(stored.getId(), stored);
            return stored.toBuilder().build();
        }

        @Override
        public Optional<Certificate> findById(Long id) {
            return Optional.ofNullable(rows.get(id)).map(c -> c.toBuilder().build());
        }

        @Override
        public Optional<Certificate> findByCode(String code) {
            return rows.values().stream().filter(c -> c.getCode().equals(code)).findFirst().map(c -> c.toBuilder().build());
        }

        @Override
        public List<Certificate> findAllById(Collection<Long> ids) {
            return ids.stream().map(rows::get).filter(Objects::nonNull).map(c -> c.toBuilder().build()).toList();
        }

        @Override
        public List<Certificate> findByEvent(Long eventId) {
            return rows.values().stream().filter(c -> eventId.equals(c.getEventId()))
                    .sorted(Comparator.comparing(Certificate::getKind).thenComparing(Certificate::getHolderName))
                    .map(c -> c.toBuilder().build()).toList();
        }

        @Override
        public List<Certificate> findIssuedTo(Long userId) {
            return rows.values().stream().filter(c -> c.getUserId().equals(userId) && c.getStatus() == CertificateStatus.ISSUED)
                    .map(c -> c.toBuilder().build()).toList();
        }

        @Override
        public int addDrafts(List<Certificate> drafts) {
            int added = 0;
            for (Certificate draft : drafts) {
                boolean held = rows.values().stream().anyMatch(c -> c.getUserId().equals(draft.getUserId())
                        && Objects.equals(c.getEventId(), draft.getEventId()) && c.getKind() == draft.getKind());
                if (held) continue;
                add(draft);
                added++;
            }
            return added;
        }

        @Override
        public void saveAll(Collection<Certificate> certificates) {
            certificates.forEach(c -> rows.put(c.getId(), c.toBuilder().build()));
        }

        @Override
        public void delete(Long id) {
            rows.remove(id);
        }
    }

    static final class Events implements RecognitionEvents {
        final List<CertificateIssued> issued = new ArrayList<>();

        @Override
        public void issued(CertificateIssued event) {
            issued.add(event);
        }
    }
}
