package com.brandonkamga.lescracks.service.impl;

import com.brandonkamga.lescracks.domain.User;
import com.brandonkamga.lescracks.domain.UserStatus;
import com.brandonkamga.lescracks.exception.NotFoundException;
import com.brandonkamga.lescracks.repository.UserRepository;
import com.brandonkamga.lescracks.service.interfaces.AdminUserService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class AdminUserServiceImpl implements AdminUserService {
    private final UserRepository users;

    public AdminUserServiceImpl(UserRepository users) { this.users = users; }

    @Override
    @Transactional(readOnly = true)
    public Page<User> list(String search, Pageable pageable) {
        if (search == null || search.isBlank()) return users.findAll(pageable);
        return users.findByEmailContainingIgnoreCaseOrFirstNameContainingIgnoreCaseOrLastNameContainingIgnoreCase(
                search.trim(), search.trim(), search.trim(), pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public User require(Long id) {
        return users.findById(id).orElseThrow(() -> new NotFoundException("Utilisateur", "id", id));
    }

    @Override
    public User setStatus(Long id, UserStatus status) {
        User user = require(id);
        user.setStatus(status);
        return user;
    }

    @Override
    public void delete(Long id) { users.delete(require(id)); }
}