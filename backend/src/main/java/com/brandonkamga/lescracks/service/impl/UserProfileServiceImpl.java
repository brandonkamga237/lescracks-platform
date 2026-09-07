package com.brandonkamga.lescracks.service.impl;

import com.brandonkamga.lescracks.domain.User;
import com.brandonkamga.lescracks.dto.user.UserProfileUpdateRequest;
import com.brandonkamga.lescracks.exception.NotFoundException;
import com.brandonkamga.lescracks.repository.UserRepository;
import com.brandonkamga.lescracks.service.interfaces.UserProfileService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class UserProfileServiceImpl implements UserProfileService {
    private final UserRepository users;

    public UserProfileServiceImpl(UserRepository users) { this.users = users; }

    @Override
    @Transactional(readOnly = true)
    public User require(String email) {
        return users.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new NotFoundException("Utilisateur", "email", email));
    }

    @Override
    public User update(String email, UserProfileUpdateRequest request) {
        User user = require(email);
        user.setFirstName(request.firstName().trim());
        user.setLastName(request.lastName().trim());
        return user;
    }

    @Override
    public void delete(String email) { users.delete(require(email)); }
}