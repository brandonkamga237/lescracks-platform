package com.brandonkamga.lescracks.service.impl;

import com.brandonkamga.lescracks.domain.User;
import com.brandonkamga.lescracks.exception.NotFoundException;
import com.brandonkamga.lescracks.repository.UserRepository;
import com.brandonkamga.lescracks.service.interfaces.UserService;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Objects;

@Service
@Transactional
public class UserServiceImpl implements UserService {

    private final UserRepository users;

    public UserServiceImpl(UserRepository users) {
        this.users = users;
    }

    @Override
    public User fromToken(Jwt token) {
        return users.findBySubject(token.getSubject())
                .map(existing -> refresh(existing, token))
                .orElseGet(() -> users.save(create(token)));
    }

    private User create(Jwt token) {
        return User.builder()
                .subject(token.getSubject())
                .email(claim(token, "email"))
                .displayName(displayName(token))
                .lastSeenAt(Instant.now())
                .build();
    }

    /**
     * Keycloak is the source of truth for an email or a name, so a change there wins here.
     * Only writing when something actually differs keeps a read request from turning into a
     * write on every call.
     */
    private User refresh(User user, Jwt token) {
        String email = claim(token, "email");
        String name = displayName(token);
        boolean changed = !Objects.equals(user.getEmail(), email)
                || !Objects.equals(user.getDisplayName(), name);

        user.setLastSeenAt(Instant.now());
        if (changed) {
            user.setEmail(email);
            user.setDisplayName(name);
        }
        return user;
    }

    private String displayName(Jwt token) {
        String name = claim(token, "name");
        return name != null ? name : claim(token, "preferred_username");
    }

    private String claim(Jwt token, String name) {
        Object value = token.getClaim(name);
        return value == null ? null : value.toString();
    }

    @Override
    @Transactional(readOnly = true)
    public User require(Long id) {
        return users.findById(id).orElseThrow(() -> new NotFoundException("User", "id", id));
    }

    @Override
    @Transactional(readOnly = true)
    public User requireBySubject(String subject) {
        return users.findBySubject(subject)
                .orElseThrow(() -> new NotFoundException("User", "subject", subject));
    }
}
