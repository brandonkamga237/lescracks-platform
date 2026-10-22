package com.brandonkamga.lescracks.account.application;

import com.brandonkamga.lescracks.account.domain.model.Account;
import com.brandonkamga.lescracks.account.domain.model.AccountSearch;
import com.brandonkamga.lescracks.account.domain.port.AccountStore;
import com.brandonkamga.lescracks.shared.paging.PageQuery;
import com.brandonkamga.lescracks.shared.paging.Paged;

import java.util.Collection;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicLong;

/**
 * An AccountStore that keeps copies, like a database does: a use case that changes an account
 * and forgets to save it leaves this store unchanged, and the test reading it back sees it.
 */
public class InMemoryAccountStore implements AccountStore {

    private final Map<Long, Account> rows = new LinkedHashMap<>();
    private final AtomicLong ids = new AtomicLong(1000);

    /** The account as stored, for assertions. */
    public Account stored(Long id) {
        return findById(id).orElseThrow();
    }

    @Override
    public Optional<Account> findById(Long id) {
        return Optional.ofNullable(rows.get(id)).map(Account::toBuilder).map(Account.AccountBuilder::build);
    }

    @Override
    public Optional<Account> findByEmail(String email) {
        return rows.values().stream().filter(account -> account.getEmail() != null && account.getEmail().equalsIgnoreCase(email))
                .findFirst().map(account -> account.toBuilder().build());
    }

    @Override
    public List<Account> findAllById(Collection<Long> wanted) {
        return wanted.stream().filter(rows::containsKey).map(id -> rows.get(id).toBuilder().build()).toList();
    }

    @Override
    public Paged<Account> search(AccountSearch search, PageQuery page) {
        List<Account> all = searchAll(search);
        List<Account> slice = all.stream().skip((long) page.page() * page.size()).limit(page.size()).toList();
        return new Paged<>(slice, page.page(), page.size(), all.size());
    }

    @Override
    public List<Account> searchAll(AccountSearch search) {
        return rows.values().stream()
                .filter(account -> search.verified() == null || account.isEmailVerified() == search.verified())
                .sorted(Comparator.comparing(Account::getCreatedAt).reversed())
                .map(account -> account.toBuilder().build()).toList();
    }

    @Override
    public Account save(Account account) {
        Account row = account.toBuilder().build();
        if (row.getId() == null) row.setId(ids.incrementAndGet());
        rows.put(row.getId(), row);
        return row.toBuilder().build();
    }

    @Override
    public void delete(Long id) {
        rows.remove(id);
    }
}
