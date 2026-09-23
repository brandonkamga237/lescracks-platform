package com.brandonkamga.lescracks.identity.domain;

import java.util.List;

public interface AdminManagementService {
    List<Admin> list();
    Admin create(String username, String password);
    void delete(Long id);
}
