package com.brandonkamga.lescracks.account.application;

import com.brandonkamga.lescracks.account.domain.model.Account;
import com.brandonkamga.lescracks.account.domain.model.AccountDeleting;
import com.brandonkamga.lescracks.account.domain.model.AccountSearch;
import com.brandonkamga.lescracks.account.domain.model.AccountStatus;
import com.brandonkamga.lescracks.account.domain.port.AccountEvents;
import com.brandonkamga.lescracks.account.domain.port.AccountStore;
import com.brandonkamga.lescracks.shared.exception.ConflictException;
import com.brandonkamga.lescracks.shared.exception.NotFoundException;
import com.brandonkamga.lescracks.shared.paging.PageQuery;
import com.brandonkamga.lescracks.shared.paging.Paged;

import java.util.List;

public class AccountAdminServiceImpl implements AccountAdminService {
    private final AccountStore accounts;
    private final EmailVerificationService verification;
    private final AccountEvents events;

    public AccountAdminServiceImpl(AccountStore accounts, EmailVerificationService verification, AccountEvents events) {
        this.accounts = accounts;
        this.verification = verification;
        this.events = events;
    }

    @Override
    public Paged<AccountSummary> list(AccountSearch search, PageQuery page) {
        return accounts.search(search, page).map(AccountSummary::of);
    }

    @Override
    public List<AccountSummary> listAll(AccountSearch search) {
        return accounts.searchAll(search).stream().map(AccountSummary::of).toList();
    }

    @Override
    public AccountSummary require(Long id) {
        return AccountSummary.of(requireAccount(id));
    }

    @Override
    public AccountSummary setStatus(Long id, AccountStatus status) {
        Account account = requireAccount(id);
        account.setStatus(status);
        return AccountSummary.of(accounts.save(account));
    }

    @Override
    public void delete(Long id) {
        Long existing = requireAccount(id).getId();
        events.deleting(new AccountDeleting(existing));
        accounts.delete(existing);
    }

    @Override
    public void resendVerification(Long id) {
        Account account = requireAccount(id);
        if (account.isEmailVerified()) throw new ConflictException("Cette adresse est déjà confirmée.");
        verification.send(AccountSummary.of(account));
    }

    @Override
    public AccountSummary markVerified(Long id) {
        Account account = requireAccount(id);
        account.setEmailVerified(true);
        return AccountSummary.of(accounts.save(account));
    }

    private Account requireAccount(Long id) {
        return accounts.findById(id).orElseThrow(() -> new NotFoundException("Utilisateur", "id", id));
    }


}
