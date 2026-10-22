package com.brandonkamga.lescracks.account.domain.port;

import com.brandonkamga.lescracks.account.domain.model.Account;
import com.brandonkamga.lescracks.account.domain.model.AccountSearch;
import com.brandonkamga.lescracks.shared.paging.PageQuery;
import com.brandonkamga.lescracks.shared.paging.Paged;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

/** Where accounts are kept. Emails are compared without regard to case. */
public interface AccountStore {

    Optional<Account> findById(Long id);

    Optional<Account> findByEmail(String email);

    /** One query, whatever the number of ids; unknown ids are simply absent. */
    List<Account> findAllById(Collection<Long> ids);

    /** Ignores case; one query whatever the number of addresses. */
    List<Account> findAllByEmail(Collection<String> emails);

    /** Newest first. */
    Paged<Account> search(AccountSearch search, PageQuery page);

    /** Everyone matching, newest first: for exports, never for a screen. */
    List<Account> searchAll(AccountSearch search);

    /** Inserts an account without an id, updates one with an id; returns it as stored. */
    Account save(Account account);

    void delete(Long id);
}
