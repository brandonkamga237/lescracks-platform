package com.brandonkamga.lescracks.member.domain.port;

import com.brandonkamga.lescracks.member.domain.model.MemberProfile;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface MemberProfileStore {

    Optional<MemberProfile> find(Long accountId);

    /** Profiles of several members in one round trip; members without one are absent. */
    List<MemberProfile> findAll(Collection<Long> accountIds);

    /** Creates the profile or replaces it, interests included. */
    MemberProfile save(MemberProfile profile);
}
