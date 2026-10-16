package com.brandonkamga.lescracks.identity.api;

import com.brandonkamga.lescracks.identity.api.dto.ForgotPasswordRequest;
import com.brandonkamga.lescracks.identity.api.dto.ResetPasswordRequest;
import com.brandonkamga.lescracks.identity.api.dto.UserAuthResponse;
import com.brandonkamga.lescracks.identity.api.dto.UserLoginRequest;
import com.brandonkamga.lescracks.identity.api.dto.UserRegisterRequest;
import com.brandonkamga.lescracks.identity.domain.User;
import com.brandonkamga.lescracks.identity.domain.EmailVerificationService;
import com.brandonkamga.lescracks.identity.domain.PasswordResetService;
import com.brandonkamga.lescracks.identity.domain.UserAuthService;
import com.brandonkamga.lescracks.identity.domain.UserRegistrationService;

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
    private final UserRegistrationService registration;
    private final UserAuthService auth;
    private final EmailVerificationService verification;
    private final PasswordResetService passwordReset;
    private final SecurityContextRepository contexts = new HttpSessionSecurityContextRepository();

    public UserAuthController(UserRegistrationService registration, UserAuthService auth,
                              EmailVerificationService verification, PasswordResetService passwordReset) {
        this.registration = registration;
        this.auth = auth;
        this.verification = verification;
        this.passwordReset = passwordReset;
    }

    @PostMapping("/register")
    public ResponseEntity<UserAuthResponse> register(@Valid @RequestBody UserRegisterRequest request) {
        User user = registration.register(request.toRegistration());
        return ResponseEntity.status(201).body(response(user));
    }

    @PostMapping("/login")
    public ResponseEntity<UserAuthResponse> login(@Valid @RequestBody UserLoginRequest request,
                                                  HttpServletRequest httpRequest,
                                                  HttpServletResponse httpResponse) {
        User user = auth.authenticate(request.toCredentials());
        return login(user, httpRequest, httpResponse);
    }

    @PostMapping("/verify-email")
    public ResponseEntity<Void> verifyEmail(@RequestParam String token) {
        verification.verify(token);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/resend-verification")
    public ResponseEntity<Void> resendVerification(@Valid @RequestBody Map<String, String> body) {
        verification.resend(body.getOrDefault("email", ""));
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<Void> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        passwordReset.request(request.email());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/reset-password")
    public ResponseEntity<Void> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        passwordReset.reset(request.token(), request.password());
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
