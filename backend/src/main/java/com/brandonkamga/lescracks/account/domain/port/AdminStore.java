package com.brandonkamga.lescracks.account.domain.port;

import com.brandonkamga.lescracks.account.domain.model.Admin;

import java.util.List;
import java.util.Optional;

/** Where administrators are kept. */
public interface AdminStore {

    /** Ignores case: "Admin" and "admin" are the same account. */
    Optional<Admin> findByUsername(String username);

    List<Admin> findAll();

    Admin save(Admin admin);

    void deleteById(Long id);
}
