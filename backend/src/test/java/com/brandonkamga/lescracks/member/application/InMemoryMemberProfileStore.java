package com.brandonkamga.lescracks.member.application;

import com.brandonkamga.lescracks.member.domain.model.MemberProfile;
import com.brandonkamga.lescracks.member.domain.port.MemberProfileStore;

import java.util.Collection;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/** Keeps copies, like the database: a profile changed but never saved stays as it was here. */
public class InMemoryMemberProfileStore implements MemberProfileStore {

    private final Map<Long, MemberProfile> rows = new HashMap<>();

    public MemberProfile stored(Long accountId) {
        return find(accountId).orElseThrow();
    }

    @Override
    public Optional<MemberProfile> find(Long accountId) {
        return Optional.ofNullable(rows.get(accountId)).map(InMemoryMemberProfileStore::copy);
    }

    @Override
    public List<MemberProfile> findAll(Collection<Long> accountIds) {
        return accountIds.stream().filter(rows::containsKey).map(rows::get).map(InMemoryMemberProfileStore::copy).toList();
    }

    @Override
    public MemberProfile save(MemberProfile profile) {
        rows.put(profile.getAccountId(), copy(profile));
        return copy(profile);
    }

    private static MemberProfile copy(MemberProfile profile) {
        return profile.toBuilder()
                .socialLinks(profile.getSocialLinks() == null ? null : new HashMap<>(profile.getSocialLinks()))
                .interests(profile.getInterests() == null ? null : new HashSet<>(profile.getInterests()))
                .build();
    }
}
