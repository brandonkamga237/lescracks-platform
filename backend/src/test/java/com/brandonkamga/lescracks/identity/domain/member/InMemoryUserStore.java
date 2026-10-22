package com.brandonkamga.lescracks.identity.domain.member;

import com.brandonkamga.lescracks.shared.paging.PageQuery;
import com.brandonkamga.lescracks.shared.paging.Paged;

import java.util.Collection;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicLong;

/**
 * A UserStore that keeps copies, like a database does: a service that changes a user and forgets
 * to save it leaves this store unchanged, and the test reading the stored user sees it.
 */
public class InMemoryUserStore implements UserStore {

    private final Map<Long, User> rows = new LinkedHashMap<>();
    private final AtomicLong ids = new AtomicLong(1000);

    /** The user as stored, for assertions. */
    public User stored(Long id) {
        return findById(id).orElseThrow();
    }

    @Override
    public Optional<User> findById(Long id) {
        return Optional.ofNullable(rows.get(id)).map(InMemoryUserStore::copy);
    }

    @Override
    public Optional<User> findByEmail(String email) {
        return rows.values().stream().filter(user -> user.getEmail() != null && user.getEmail().equalsIgnoreCase(email))
                .findFirst().map(InMemoryUserStore::copy);
    }

    @Override
    public List<User> findAllById(Collection<Long> wanted) {
        return wanted.stream().filter(rows::containsKey).map(rows::get).map(InMemoryUserStore::copy).toList();
    }

    @Override
    public Paged<User> search(UserSearch search, PageQuery page) {
        List<User> all = searchAll(search);
        List<User> slice = all.stream().skip((long) page.page() * page.size()).limit(page.size()).toList();
        return new Paged<>(slice, page.page(), page.size(), all.size());
    }

    @Override
    public List<User> searchAll(UserSearch search) {
        return rows.values().stream()
                .filter(user -> search.verified() == null || user.isEmailVerified() == search.verified())
                .filter(user -> search.kind() == null || (search.kind() == UserSearch.Kind.MEMBER) == user.hasLoginMethod())
                .sorted(Comparator.comparing(User::getCreatedAt).reversed())
                .map(InMemoryUserStore::copy).toList();
    }

    @Override
    public User save(User user) {
        User row = copy(user);
        if (row.getId() == null) row.setId(ids.incrementAndGet());
        rows.put(row.getId(), row);
        return copy(row);
    }

    @Override
    public void delete(Long id) {
        rows.remove(id);
    }

    private static User copy(User user) {
        return user.toBuilder()
                .socialLinks(user.getSocialLinks() == null ? null : new HashMap<>(user.getSocialLinks()))
                .interests(user.getInterests() == null ? null : new HashSet<>(user.getInterests()))
                .build();
    }
}
