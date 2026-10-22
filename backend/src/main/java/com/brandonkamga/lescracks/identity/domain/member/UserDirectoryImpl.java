package com.brandonkamga.lescracks.identity.domain.member;

import com.brandonkamga.lescracks.shared.exception.NotFoundException;

import java.util.Collection;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;

public class UserDirectoryImpl implements UserDirectory {
    private final UserStore users;

    public UserDirectoryImpl(UserStore users) {
        this.users = users;
    }

    @Override
    public Optional<User> find(String email) {
        return users.findByEmail(email.trim());
    }

    @Override
    public User require(String email) {
        return find(email).orElseThrow(() -> new NotFoundException("Utilisateur", "email", email));
    }

    @Override
    public User require(Long id) {
        return users.findById(id).orElseThrow(() -> new NotFoundException("Utilisateur", "id", id));
    }

    @Override
    public Map<Long, User> findAll(Collection<Long> ids) {
        if (ids.isEmpty()) return Map.of();
        return users.findAllById(ids).stream().collect(Collectors.toMap(User::getId, Function.identity()));
    }

    @Override
    public User createContact(String email, String firstName, String lastName) {
        return users.save(User.builder()
                .email(email.trim().toLowerCase())
                .firstName(firstName == null ? "" : firstName.trim())
                .lastName(lastName == null ? "" : lastName.trim())
                .status(UserStatus.ACTIVE)
                .emailVerified(false)
                .provider(AuthProvider.LOCAL)
                .build());
    }
}
