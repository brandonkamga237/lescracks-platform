package com.brandonkamga.lescracks.identity.domain;

import com.brandonkamga.lescracks.identity.infra.UserRepository;
import com.brandonkamga.lescracks.shared.exception.NotFoundException;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collection;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@Transactional
public class UserDirectoryImpl implements UserDirectory {
    private final UserRepository users;

    public UserDirectoryImpl(UserRepository users) {
        this.users = users;
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<User> find(String email) {
        return users.findByEmailIgnoreCase(email.trim());
    }

    @Override
    @Transactional(readOnly = true)
    public User require(String email) {
        return find(email).orElseThrow(() -> new NotFoundException("Utilisateur", "email", email));
    }

    @Override
    @Transactional(readOnly = true)
    public User require(Long id) {
        return users.findById(id).orElseThrow(() -> new NotFoundException("Utilisateur", "id", id));
    }

    @Override
    @Transactional(readOnly = true)
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
