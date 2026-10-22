package com.brandonkamga.lescracks.member.application;

import com.brandonkamga.lescracks.account.application.AccountDirectory;
import com.brandonkamga.lescracks.account.application.AccountSummary;
import com.brandonkamga.lescracks.member.domain.model.MemberProfile;
import com.brandonkamga.lescracks.member.domain.port.MemberProfileStore;

import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;

public class MemberDirectoryImpl implements MemberDirectory {
    private final AccountDirectory accounts;
    private final MemberProfileStore profiles;

    public MemberDirectoryImpl(AccountDirectory accounts, MemberProfileStore profiles) {
        this.accounts = accounts;
        this.profiles = profiles;
    }

    @Override
    public Optional<Member> find(String email) {
        return accounts.find(email).map(this::member);
    }

    @Override
    public Member require(String email) {
        return member(accounts.require(email));
    }

    @Override
    public Member require(Long id) {
        return member(accounts.require(id));
    }

    @Override
    public Map<Long, Member> findAll(Collection<Long> ids) {
        if (ids.isEmpty()) return Map.of();
        Map<Long, AccountSummary> found = accounts.findAll(ids);
        Map<Long, MemberProfile> byAccount = profiles.findAll(found.keySet()).stream()
                .collect(Collectors.toMap(MemberProfile::getAccountId, Function.identity()));
        Map<Long, Member> members = new LinkedHashMap<>();
        found.forEach((id, account) -> members.put(id,
                Member.of(account, byAccount.getOrDefault(id, MemberProfile.empty(id)))));
        return members;
    }

    private Member member(AccountSummary account) {
        return Member.of(account, profiles.find(account.getId()).orElseGet(() -> MemberProfile.empty(account.getId())));
    }
}
