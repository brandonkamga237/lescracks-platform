package com.brandonkamga.lescracks.controller;

import com.brandonkamga.lescracks.domain.User;
import com.brandonkamga.lescracks.dto.auth.*;
import com.brandonkamga.lescracks.service.interfaces.UserAuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class UserAuthController {
    private final UserAuthService auth;
    private final SecurityContextRepository contexts = new HttpSessionSecurityContextRepository();

    public UserAuthController(UserAuthService auth) {
        this.auth = auth;
    }

    @PostMapping("/register")
    public ResponseEntity<UserAuthResponse> register(@Valid @RequestBody UserRegisterRequest request) {
        User user = auth.register(request);
        return ResponseEntity.status(201).body(response(user));
    }

    @PostMapping("/login")
    public ResponseEntity<UserAuthResponse> login(@Valid @RequestBody UserLoginRequest request,
                                                  HttpServletRequest httpRequest,
                                                  HttpServletResponse httpResponse) {
        User user = auth.authenticate(request);
        return login(user, httpRequest, httpResponse);
    }

    @PostMapping("/verify-email")
    public ResponseEntity<Void> verifyEmail(@RequestParam String token) {
        auth.verifyEmail(token);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/resend-verification")
    public ResponseEntity<Void> resendVerification(@Valid @RequestBody Map<String, String> body) {
        auth.resendVerificationEmail(body.getOrDefault("email", ""));
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<Void> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        auth.requestPasswordReset(request);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/reset-password")
    public ResponseEntity<Void> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        auth.resetPassword(request);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletRequest request) {
        SecurityContextHolder.clearContext();
        var session = request.getSession(false);
        if (session != null) session.invalidate();
        return ResponseEntity.noContent().build();
    }

    private ResponseEntity<UserAuthResponse> login(User user,
                                                   HttpServletRequest request, HttpServletResponse response) {
        Authentication authentication = new UsernamePasswordAuthenticationToken(
                user.getEmail(), null, java.util.List.of(new SimpleGrantedAuthority("ROLE_USER")));
        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(authentication);
        SecurityContextHolder.setContext(context);
        contexts.saveContext(context, request, response);
        return ResponseEntity.ok(response(user));
    }

    private UserAuthResponse response(User user) {
        return new UserAuthResponse(user.getId(), user.getEmail(), user.getFirstName(), user.getLastName(), user.isEmailVerified(), user.getProvider());
    }
}
