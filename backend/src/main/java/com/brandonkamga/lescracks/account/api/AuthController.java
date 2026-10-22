package com.brandonkamga.lescracks.account.api;

import com.brandonkamga.lescracks.account.api.dto.AuthResponse;
import com.brandonkamga.lescracks.account.api.dto.ForgotPasswordRequest;
import com.brandonkamga.lescracks.account.api.dto.LoginRequest;
import com.brandonkamga.lescracks.account.api.dto.RegisterRequest;
import com.brandonkamga.lescracks.account.api.dto.ResetPasswordRequest;
import com.brandonkamga.lescracks.account.application.AccountSummary;
import com.brandonkamga.lescracks.account.application.EmailVerificationService;
import com.brandonkamga.lescracks.account.application.PasswordResetService;
import com.brandonkamga.lescracks.account.application.SignInService;
import com.brandonkamga.lescracks.account.application.SignUpService;

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

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final SignUpService signUp;
    private final SignInService signIn;
    private final EmailVerificationService verification;
    private final PasswordResetService passwordReset;
    private final SecurityContextRepository contexts = new HttpSessionSecurityContextRepository();

    public AuthController(SignUpService signUp, SignInService signIn,
                          EmailVerificationService verification, PasswordResetService passwordReset) {
        this.signUp = signUp;
        this.signIn = signIn;
        this.verification = verification;
        this.passwordReset = passwordReset;
    }

    /** The new member is signed in at once; confirming the address can wait (see the banner). */
    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request,
                                                 HttpServletRequest httpRequest,
                                                 HttpServletResponse httpResponse) {
        AccountSummary account = signUp.register(request.toRegistration());
        startSession(account, httpRequest, httpResponse);
        return ResponseEntity.status(201).body(AuthResponse.of(account));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request,
                                              HttpServletRequest httpRequest,
                                              HttpServletResponse httpResponse) {
        AccountSummary account = signIn.authenticate(request.toCredentials());
        startSession(account, httpRequest, httpResponse);
        return ResponseEntity.ok(AuthResponse.of(account));
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

    private void startSession(AccountSummary account, HttpServletRequest request, HttpServletResponse response) {
        Authentication authentication = new UsernamePasswordAuthenticationToken(
                account.getEmail(), null, List.of(new SimpleGrantedAuthority("ROLE_USER")));
        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(authentication);
        SecurityContextHolder.setContext(context);
        contexts.saveContext(context, request, response);
    }
}
