package com.brandonkamga.lescracks.identity.domain;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface AdminUserService {
    Page<User> list(UserSearch search, Pageable pageable);
    User require(Long id);
    User setStatus(Long id, UserStatus status);
    void delete(Long id);

    /** Support: a member says the link never came. Sent at once, without the member's one-minute wait. */
    void resendVerification(Long id);

    /** Support: the member proved the address another way (they wrote from it). */
    User markVerified(Long id);
}