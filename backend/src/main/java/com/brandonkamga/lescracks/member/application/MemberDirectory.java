package com.brandonkamga.lescracks.member.application;

import java.util.Collection;
import java.util.Map;
import java.util.Optional;

/** How other modules find members, without knowing how accounts and profiles are stored. */
public interface MemberDirectory {

    Optional<Member> find(String email);

    Member require(String email);

    Member require(Long id);

    /** Two queries whatever the number of ids; unknown ids are simply absent. */
    Map<Long, Member> findAll(Collection<Long> ids);
}
