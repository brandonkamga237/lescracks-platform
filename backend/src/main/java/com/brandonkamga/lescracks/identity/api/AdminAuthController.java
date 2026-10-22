package com.brandonkamga.lescracks.identity.api;

import com.brandonkamga.lescracks.identity.api.dto.AdminAuthResponse;
import com.brandonkamga.lescracks.identity.api.dto.AdminLoginRequest;
import com.brandonkamga.lescracks.identity.domain.admin.Admin;
import com.brandonkamga.lescracks.identity.domain.admin.AdminAuthService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;

import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.util.List;

@RestController
@RequestMapping("/api/admin/auth")
public class AdminAuthController {
    private final AdminAuthService auth;
    private static final Duration ADMIN_IDLE = Duration.ofHours(12);

    private final SecurityContextRepository contexts = new HttpSessionSecurityContextRepository();

    public AdminAuthController(AdminAuthService auth) {
        this.auth = auth;
    }

    @PostMapping("/login")
    public ResponseEntity<AdminAuthResponse> login(@Valid @RequestBody AdminLoginRequest request,
                                                   HttpServletRequest httpRequest,
                                                   HttpServletResponse httpResponse) {
        Admin admin = auth.authenticate(request.username(), request.password());
        Authentication authentication = UsernamePasswordAuthenticationToken.authenticated(
                admin.getUsername(), null, List.of(new SimpleGrantedAuthority("ROLE_ADMIN")));
        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(authentication);
        SecurityContextHolder.setContext(context);
        contexts.saveContext(context, httpRequest, httpResponse);
        // The back office can publish and delete: it keeps a working day, not a member's month.
        httpRequest.getSession().setMaxInactiveInterval((int) ADMIN_IDLE.toSeconds());
        return ResponseEntity.ok(new AdminAuthResponse(authentication.getName(), "ADMIN"));
    }

    @GetMapping("/me")
    public AdminAuthResponse me(Authentication authentication) {
        return new AdminAuthResponse(authentication.getName(), "ADMIN");
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletRequest request) {
        SecurityContextHolder.clearContext();
        var session = request.getSession(false);
        if (session != null) session.invalidate();
        return ResponseEntity.noContent().build();
    }
}