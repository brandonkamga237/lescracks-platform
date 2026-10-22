package com.brandonkamga.lescracks.account.application;

import com.brandonkamga.lescracks.account.domain.model.Admin;

import java.util.List;

public interface AdminManagementService {
    List<Admin> list();
    Admin create(String username, String password);
    void delete(Long id);
}
