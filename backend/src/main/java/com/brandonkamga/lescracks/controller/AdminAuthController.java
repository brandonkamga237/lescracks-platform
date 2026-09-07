package com.brandonkamga.lescracks.controller;

import com.brandonkamga.lescracks.dto.admin.AdminAuthResponse;
import com.brandonkamga.lescracks.dto.admin.AdminLoginRequest;
import com.brandonkamga.lescracks.service.interfaces.AdminAuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationServiceException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/auth")
public class AdminAuthController {
    private final AdminAuthService auth;
    private final SecurityContextRepository contexts = new HttpSessionSecurityContextRepository();

    public AdminAuthController(AdminAuthService auth) {
        this.auth = auth;
    }

    @PostMapping("/login")
    public ResponseEntity<AdminAuthResponse> login(@Valid @RequestBody AdminLoginRequest request,
                                                   HttpServletRequest httpRequest,
                                                   HttpServletResponse httpResponse) {
        Authentication authentication = auth.authenticate(request.username(), request.password());
        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(authentication);
        SecurityContextHolder.setContext(context);
        contexts.saveContext(context, httpRequest, httpResponse);
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