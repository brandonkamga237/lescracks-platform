package com.brandonkamga.lescracks.account.application;

import com.brandonkamga.lescracks.account.domain.model.AccountSearch;
import com.brandonkamga.lescracks.account.domain.model.AccountStatus;
import com.brandonkamga.lescracks.shared.paging.PageQuery;
import com.brandonkamga.lescracks.shared.paging.Paged;

import java.util.List;

/** The back office's hold on accounts: list, inspect, suspend, delete, and help with confirmation. */
public interface AccountAdminService {
    Paged<AccountSummary> list(AccountSearch search, PageQuery page);

    /** Every match at once, for the CSV export. */
    List<AccountSummary> listAll(AccountSearch search);

    AccountSummary require(Long id);
    AccountSummary setStatus(Long id, AccountStatus status);
    void delete(Long id);

    /** Support: a member says the link never came. Sent at once, without the member's one-minute wait. */
    void resendVerification(Long id);

    /** Support: the member proved the address another way (they wrote from it). */
    AccountSummary markVerified(Long id);
}
