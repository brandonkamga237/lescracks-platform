package com.brandonkamga.lescracks.member.application;

import com.brandonkamga.lescracks.account.domain.model.AccountSearch;
import com.brandonkamga.lescracks.account.domain.model.AccountStatus;
import com.brandonkamga.lescracks.shared.paging.PageQuery;
import com.brandonkamga.lescracks.shared.paging.Paged;

import java.util.List;

/** The back office's view of members: their account and their profile, side by side. */
public interface MemberAdminService {

    Paged<MemberView> list(AccountSearch search, PageQuery page);

    /** Every match at once, for the CSV export. */
    List<MemberView> listAll(AccountSearch search);

    MemberView require(Long id);

    MemberView setStatus(Long id, AccountStatus status);

    MemberView markVerified(Long id);
}
