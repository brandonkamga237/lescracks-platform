package com.brandonkamga.lescracks.member.application;

import com.brandonkamga.lescracks.account.application.AccountAdminService;
import com.brandonkamga.lescracks.account.application.AccountSummary;
import com.brandonkamga.lescracks.account.domain.model.AccountSearch;
import com.brandonkamga.lescracks.account.domain.model.AccountStatus;
import com.brandonkamga.lescracks.member.domain.model.MemberProfile;
import com.brandonkamga.lescracks.member.domain.port.MemberProfileStore;
import com.brandonkamga.lescracks.shared.paging.PageQuery;
import com.brandonkamga.lescracks.shared.paging.Paged;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

public class MemberAdminServiceImpl implements MemberAdminService {
    private final AccountAdminService accounts;
    private final MemberProfileStore profiles;

    public MemberAdminServiceImpl(AccountAdminService accounts, MemberProfileStore profiles) {
        this.accounts = accounts;
        this.profiles = profiles;
    }

    @Override
    public Paged<MemberView> list(AccountSearch search, PageQuery page) {
        Paged<AccountSummary> found = accounts.list(search, page);
        Map<Long, MemberProfile> byAccount = profilesOf(found.items());
        return found.map(account -> view(account, byAccount));
    }

    @Override
    public List<MemberView> listAll(AccountSearch search) {
        List<AccountSummary> found = accounts.listAll(search);
        Map<Long, MemberProfile> byAccount = profilesOf(found);
        return found.stream().map(account -> view(account, byAccount)).toList();
    }

    @Override
    public MemberView require(Long id) {
        return withProfile(accounts.require(id));
    }

    @Override
    public MemberView setStatus(Long id, AccountStatus status) {
        return withProfile(accounts.setStatus(id, status));
    }

    @Override
    public MemberView markVerified(Long id) {
        return withProfile(accounts.markVerified(id));
    }

    /** One query for the whole page, whatever its size. */
    private Map<Long, MemberProfile> profilesOf(List<AccountSummary> found) {
        return profiles.findAll(found.stream().map(AccountSummary::getId).toList()).stream()
                .collect(Collectors.toMap(MemberProfile::getAccountId, Function.identity()));
    }

    private static MemberView view(AccountSummary account, Map<Long, MemberProfile> byAccount) {
        return new MemberView(account, byAccount.getOrDefault(account.getId(), MemberProfile.empty(account.getId())));
    }

    private MemberView withProfile(AccountSummary account) {
        return new MemberView(account, profiles.find(account.getId()).orElseGet(() -> MemberProfile.empty(account.getId())));
    }
}
