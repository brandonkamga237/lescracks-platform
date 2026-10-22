package com.brandonkamga.lescracks.identity.domain.admin;

import java.util.List;

public interface AdminManagementService {
    List<Admin> list();
    Admin create(String username, String password);
    void delete(Long id);
}
