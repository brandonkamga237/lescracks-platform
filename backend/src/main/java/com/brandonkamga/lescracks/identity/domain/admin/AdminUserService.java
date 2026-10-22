package com.brandonkamga.lescracks.identity.domain.admin;

import com.brandonkamga.lescracks.identity.domain.member.User;
import com.brandonkamga.lescracks.identity.domain.member.UserSearch;
import com.brandonkamga.lescracks.identity.domain.member.UserStatus;
import com.brandonkamga.lescracks.shared.paging.PageQuery;
import com.brandonkamga.lescracks.shared.paging.Paged;

import java.util.List;

/** The back office's hold on members: list, inspect, suspend, delete, and help with confirmation. */
public interface AdminUserService {
    Paged<User> list(UserSearch search, PageQuery page);

    /** Every match at once, for the CSV export. */
    List<User> listAll(UserSearch search);

    User require(Long id);
    User setStatus(Long id, UserStatus status);
    void delete(Long id);

    /** Support: a member says the link never came. Sent at once, without the member's one-minute wait. */
    void resendVerification(Long id);

    /** Support: the member proved the address another way (they wrote from it). */
    User markVerified(Long id);
}
