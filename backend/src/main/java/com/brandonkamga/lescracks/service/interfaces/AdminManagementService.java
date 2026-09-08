package com.brandonkamga.lescracks.service.interfaces;

import com.brandonkamga.lescracks.domain.Admin;

import java.util.List;

public interface AdminManagementService {
    List<Admin> list();
    Admin create(String username, String password);
    void delete(Long id);
}
