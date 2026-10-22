package com.brandonkamga.lescracks.identity.domain.member;

import com.brandonkamga.lescracks.shared.paging.PageQuery;
import com.brandonkamga.lescracks.shared.paging.Paged;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

/** Where people are kept. Emails are compared without regard to case. */
public interface UserStore {

    Optional<User> findById(Long id);

    Optional<User> findByEmail(String email);

    /** Unknown ids are simply absent from the result. */
    List<User> findAllById(Collection<Long> ids);

    /** Newest first. */
    Paged<User> search(UserSearch search, PageQuery page);

    /** Everyone matching, newest first: for exports, never for a screen. */
    List<User> searchAll(UserSearch search);

    /** Inserts a user without an id, updates one with an id; returns it as stored. */
    User save(User user);

    void delete(Long id);
}
