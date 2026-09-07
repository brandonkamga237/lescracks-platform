package com.brandonkamga.lescracks.security;

import com.brandonkamga.lescracks.repository.AdminRepository;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class AdminUserDetailsService implements UserDetailsService {
    private final AdminRepository admins;

    public AdminUserDetailsService(AdminRepository admins) {
        this.admins = admins;
    }

    @Override
    public UserDetails loadUserByUsername(String username) {
        return admins.findByUsernameIgnoreCase(username)
                .map(admin -> User.withUsername(admin.getUsername())
                        .password(admin.getPasswordHash())
                        .roles("ADMIN")
                        .disabled(admin.getStatus() != com.brandonkamga.lescracks.domain.AdminStatus.ACTIVE)
                        .build())
                .orElseThrow(() -> new UsernameNotFoundException("Identifiants administrateur invalides."));
    }
}