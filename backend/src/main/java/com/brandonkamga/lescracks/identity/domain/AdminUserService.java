package com.brandonkamga.lescracks.identity.domain;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface AdminUserService {
    Page<User> list(String search, Pageable pageable);
    User require(Long id);
    User setStatus(Long id, UserStatus status);
    void delete(Long id);
}