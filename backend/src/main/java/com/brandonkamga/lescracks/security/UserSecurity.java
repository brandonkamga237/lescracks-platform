package com.brandonkamga.lescracks.security;

import com.brandonkamga.lescracks.domain.User;
import com.brandonkamga.lescracks.service.interfaces.UserService;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

/**
 * SpEL security helper bean used in {@code @PreAuthorize} expressions.
 *
 * Usage example:
 *   {@code @PreAuthorize("@userSecurity.isSelf(#id) or hasRole('ADMIN')")}
 */
@Component("userSecurity")
public class UserSecurity {

    private final UserService userService;

    public UserSecurity(UserService userService) {
        this.userService = userService;
    }

    /**
     * Returns true when the currently authenticated user owns the account identified by {@code userId}.
     */
    public boolean isSelf(Long userId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            return false;
        }
        User current = userService.findByEmail(auth.getName());
        return current != null && current.getId().equals(userId);
    }
}
