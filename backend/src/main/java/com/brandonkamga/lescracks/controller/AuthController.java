package com.brandonkamga.lescracks.controller;

import com.brandonkamga.lescracks.domain.PasswordResetToken;
import com.brandonkamga.lescracks.domain.Provider;
import com.brandonkamga.lescracks.domain.ProviderType;
import com.brandonkamga.lescracks.domain.Role;
import com.brandonkamga.lescracks.domain.RoleName;
import com.brandonkamga.lescracks.domain.User;
import com.brandonkamga.lescracks.dto.ApiResponse;
import com.brandonkamga.lescracks.dto.AuthResponse;
import com.brandonkamga.lescracks.dto.ForgotPasswordRequest;
import com.brandonkamga.lescracks.dto.LoginRequest;
import com.brandonkamga.lescracks.dto.ResetPasswordRequest;
import com.brandonkamga.lescracks.dto.UserRequest;
import com.brandonkamga.lescracks.exception.BadRequestException;
import com.brandonkamga.lescracks.mapper.UserMapper;
import com.brandonkamga.lescracks.repository.PasswordResetTokenRepository;
import com.brandonkamga.lescracks.repository.ProviderRepository;
import com.brandonkamga.lescracks.repository.RoleRepository;
import com.brandonkamga.lescracks.repository.UserRepository;
import com.brandonkamga.lescracks.security.AuthCookieService;
import com.brandonkamga.lescracks.security.RateLimiterService;
import com.brandonkamga.lescracks.security.jwt.JwtService;
import com.brandonkamga.lescracks.security.jwt.JwtTokenBlacklist;
import com.brandonkamga.lescracks.service.impl.MailServiceImpl;
import com.brandonkamga.lescracks.service.interfaces.UserService;
import com.brandonkamga.lescracks.util.PasswordValidator;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
@Tag(name = "Authentication", description = "Authentication API — login, registration, and session management")
public class AuthController {

    private final UserService userService;
    private final UserMapper userMapper;
    private final JwtService jwtService;
    private final JwtTokenBlacklist tokenBlacklist;
    private final RateLimiterService rateLimiter;
    private final AuthenticationManager authenticationManager;
    private final PasswordEncoder passwordEncoder;
    private final RoleRepository roleRepository;
    private final ProviderRepository providerRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final UserRepository userRepository;
    private final MailServiceImpl mailService;
    private final AuthCookieService authCookieService;

    @Value("${app.mail.reset-token-expiry-minutes:30}")
    private int resetTokenExpiryMinutes;

    /** Expiry in hours for email verification tokens. */
    private static final int VERIFICATION_TOKEN_EXPIRY_HOURS = 24;

    public AuthController(
            UserService userService,
            UserMapper userMapper,
            JwtService jwtService,
            JwtTokenBlacklist tokenBlacklist,
            RateLimiterService rateLimiter,
            AuthenticationManager authenticationManager,
            PasswordEncoder passwordEncoder,
            RoleRepository roleRepository,
            ProviderRepository providerRepository,
            PasswordResetTokenRepository passwordResetTokenRepository,
            UserRepository userRepository,
            MailServiceImpl mailService,
            AuthCookieService authCookieService) {
        this.userService                  = userService;
        this.userMapper                   = userMapper;
        this.jwtService                   = jwtService;
        this.tokenBlacklist               = tokenBlacklist;
        this.rateLimiter                  = rateLimiter;
        this.authenticationManager        = authenticationManager;
        this.passwordEncoder              = passwordEncoder;
        this.roleRepository               = roleRepository;
        this.providerRepository           = providerRepository;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
        this.userRepository               = userRepository;
        this.mailService                  = mailService;
        this.authCookieService            = authCookieService;
    }

    @PostMapping("/register")
    @Operation(summary = "Register a new user",
               description = "Create a new user account with email, username, and password. "
                           + "A verification email is sent before the account becomes active.")
    @ApiResponses({
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "201",
            description = "Account created — verification email sent",
            content = @Content(mediaType = "application/json",
                schema = @Schema(implementation = ApiResponse.class))),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400",
            description = "Invalid data or email/username already in use",
            content = @Content(mediaType = "application/json")),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "429",
            description = "Too many registration attempts",
            content = @Content(mediaType = "application/json"))
    })
    public ResponseEntity<ApiResponse<Void>> register(
            @Valid @RequestBody UserRequest userRequest,
            HttpServletRequest request) {

        enforceRateLimit(request, RateLimiterService.Limit.REGISTER);

        if (userRequest.getEmail() == null || userRequest.getEmail().isBlank()) {
            throw new BadRequestException("L'adresse email est obligatoire.");
        }
        if (userService.existsByEmail(userRequest.getEmail())) {
            throw new BadRequestException("Un compte existe déjà avec cette adresse email.");
        }
        if (userRequest.getUsername() == null || userRequest.getUsername().isBlank()) {
            throw new BadRequestException("Le nom d'utilisateur est obligatoire.");
        }
        if (userService.existsByUsername(userRequest.getUsername())) {
            throw new BadRequestException("Ce nom d'utilisateur est déjà utilisé.");
        }

        PasswordValidator.validate(userRequest.getPassword());

        Role role = roleRepository.findByName(RoleName.user)
                .orElseThrow(() -> new RuntimeException("Role 'user' not found"));
        Provider localProvider = providerRepository.findByProviderName(ProviderType.LOCAL)
                .orElseThrow(() -> new RuntimeException("LOCAL provider not found"));

        String verificationToken = UUID.randomUUID().toString();

        User user = new User();
        user.setEmail(userRequest.getEmail());
        user.setUsername(userRequest.getUsername());
        user.setPassword(passwordEncoder.encode(userRequest.getPassword()));
        user.setRole(role);
        user.setPhone(userRequest.getPhone());
        user.setCountry(userRequest.getCountry());
        user.setProvider(localProvider);
        user.setProviderUserId(null);
        user.setEmailVerified(false);
        user.setVerificationToken(verificationToken);
        user.setVerificationTokenExpiresAt(
                LocalDateTime.now().plusHours(VERIFICATION_TOKEN_EXPIRY_HOURS));

        User savedUser = userService.save(user);
        mailService.sendEmailVerification(
                savedUser.getEmail(), savedUser.getUsername(), verificationToken);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success(null,
                        "Compte créé ! Vérifie ta boîte mail pour activer ton compte."));
    }

    @PostMapping("/verify-email")
    @Transactional
    @Operation(summary = "Verify email address",
               description = "Activate the account using the token received by email. "
                           + "The verification link expires after 24 hours.")
    public ResponseEntity<ApiResponse<AuthResponse>> verifyEmail(
            @RequestParam String token,
            HttpServletResponse httpResponse) {
        User user = userRepository.findByVerificationToken(token)
                .orElseThrow(() -> new BadRequestException(
                        "Ce lien de vérification est invalide ou a déjà été utilisé."));

        if (user.getVerificationTokenExpiresAt() != null
                && user.getVerificationTokenExpiresAt().isBefore(LocalDateTime.now())) {
            throw new BadRequestException(
                    "Ce lien de vérification a expiré. Merci de recommencer l'inscription.");
        }

        user.setEmailVerified(true);
        user.setVerificationToken(null);
        user.setVerificationTokenExpiresAt(null);
        userService.save(user);

        mailService.sendWelcome(user.getEmail(), user.getUsername());

        String jwt = jwtService.generateTokenForUser(user.getEmail());

        // Log the user straight in via the HttpOnly cookie.
        authCookieService.write(httpResponse, jwt);

        return ResponseEntity.ok(ApiResponse.success(
                AuthResponse.of(jwt, userMapper.toResponse(user)),
                "Adresse email confirmée — bienvenue chez LesCracks !"));
    }

    /**
     * Send the verification email again.
     *
     * Without this, an unverified account is a tombstone. The mail lands in spam, or the
     * 24h token quietly expires, and the person is stuck for good: they cannot log in
     * ("verify your email"), and they cannot register again ("that email is taken").
     * Every dead end has to have an exit.
     *
     * Three things this must not become:
     *   - an ACCOUNT ORACLE: it answers identically whether the address exists or not,
     *     otherwise anyone can farm it to discover who has an account here;
     *   - an EMAIL BOMB: rate-limited per IP and per address, so it cannot be pointed at
     *     someone else's inbox;
     *   - a TOKEN FARM: the previous token is replaced, so only the newest link works.
     */
    @PostMapping("/resend-verification")
    @Transactional
    @Operation(summary = "Renvoyer l'email de vérification",
               description = "Réponse identique que l'adresse existe ou non, pour ne pas révéler qui a un compte.")
    public ResponseEntity<ApiResponse<Void>> resendVerification(
            @Valid @RequestBody ForgotPasswordRequest request,
            HttpServletRequest httpRequest) {

        enforceRateLimit(httpRequest, RateLimiterService.Limit.FORGOT_PASSWORD);
        String email = normalizeEmail(request.getEmail());
        if (!rateLimiter.isAllowed("RESEND_EMAIL:" + email, RateLimiterService.Limit.FORGOT_PASSWORD)) {
            throw new BadRequestException("Trop de demandes. Réessaie dans quelques minutes.");
        }

        User user = userService.findByEmail(request.getEmail());

        // Only a local, still-unverified account has anything to resend. An OAuth user has
        // no email to confirm, and a verified user would just be confused by another link.
        boolean shouldSend = user != null
                && user.getProvider() != null
                && ProviderType.LOCAL.equals(user.getProvider().getProviderName())
                && !user.isEmailVerified();

        if (shouldSend) {
            // Rotate: the old link stops working, so an intercepted one is worthless.
            String token = UUID.randomUUID().toString();
            user.setVerificationToken(token);
            user.setVerificationTokenExpiresAt(
                    LocalDateTime.now().plusHours(VERIFICATION_TOKEN_EXPIRY_HOURS));
            userService.save(user);

            mailService.sendEmailVerification(user.getEmail(), user.getUsername(), token);
        }

        // Same answer in every case — the caller learns nothing about who exists.
        return ResponseEntity.ok(ApiResponse.success(null,
                "Si un compte non vérifié existe pour cette adresse, un nouveau lien vient d'être envoyé."));
    }

    @PostMapping("/login")
    @Operation(summary = "User login",
               description = "Authenticate with email and password. Returns a JWT token "
                           + "to be sent as a Bearer token in subsequent requests.")
    @ApiResponses({
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200",
            description = "Login successful",
            content = @Content(mediaType = "application/json",
                schema = @Schema(implementation = ApiResponse.class))),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400",
            description = "Invalid email or password"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "429",
            description = "Too many login attempts")
    })
    public ResponseEntity<ApiResponse<AuthResponse>> login(
            @Valid @RequestBody LoginRequest loginRequest,
            HttpServletRequest request,
            HttpServletResponse httpResponse) {

        // Rate-limit on BOTH the client IP and the target email. The IP dimension can be
        // bypassed by spoofing X-Forwarded-For, so the per-email limit is what actually caps
        // a brute-force attempt against a specific account (SEC-6).
        String ipKey    = "LOGIN_IP:" + getClientIp(request);
        String emailKey = "LOGIN_EMAIL:" + normalizeEmail(loginRequest.getEmail());
        boolean ipOk    = rateLimiter.isAllowed(ipKey, RateLimiterService.Limit.LOGIN);
        boolean emailOk = rateLimiter.isAllowed(emailKey, RateLimiterService.Limit.LOGIN);
        if (!ipOk || !emailOk) {
            throw new BadRequestException(
                    "Trop de tentatives de connexion. Réessaie dans quelques minutes.");
        }

        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            loginRequest.getEmail(), loginRequest.getPassword()));

            User user = userService.findByEmail(loginRequest.getEmail());
            if (user == null) {
                // Keep the message generic to avoid revealing which accounts exist.
                throw new BadRequestException("Email ou mot de passe incorrect.");
            }

            if (user.getProvider() != null
                    && ProviderType.LOCAL.equals(user.getProvider().getProviderName())
                    && !user.isEmailVerified()) {
                throw new BadRequestException(
                        "Ton adresse email n'est pas encore confirmée. "
                        + "Vérifie ta boîte mail (pense à regarder tes spams) pour activer ton compte.");
            }

            // Reset both rate-limit counters on successful login
            rateLimiter.reset(ipKey);
            rateLimiter.reset(emailKey);

            String token = jwtService.generateTokenForUser(user.getEmail());

            // The browser app authenticates with this HttpOnly cookie; the token is also
            // returned in the body for non-browser API clients.
            authCookieService.write(httpResponse, token);

            return ResponseEntity.ok(
                    ApiResponse.success(AuthResponse.of(token, userMapper.toResponse(user)),
                            "Connexion réussie."));

        } catch (BadCredentialsException e) {
            throw new BadRequestException("Email ou mot de passe incorrect.");
        }
    }

    @PostMapping("/forgot-password")
    @Transactional
    @Operation(summary = "Request a password reset",
               description = "Send a password-reset email valid for 30 minutes. "
                           + "Always returns 200 to avoid revealing whether the email exists.")
    public ResponseEntity<ApiResponse<Void>> forgotPassword(
            @Valid @RequestBody ForgotPasswordRequest request,
            HttpServletRequest httpRequest) {

        enforceRateLimit(httpRequest, RateLimiterService.Limit.FORGOT_PASSWORD);

        // Also cap per target email so a spoofed X-Forwarded-For cannot be used to
        // email-bomb a specific address by rotating the apparent client IP (SEC-6).
        if (!rateLimiter.isAllowed("FORGOT_EMAIL:" + normalizeEmail(request.getEmail()),
                RateLimiterService.Limit.FORGOT_PASSWORD)) {
            throw new BadRequestException("Trop de requêtes. Réessaie dans quelques minutes.");
        }

        User user = userService.findByEmail(request.getEmail());

        // A GitHub/Google account has no password to reset. Sending the link anyway would
        // let someone set a password on an account they reached through OAuth, and would
        // just confuse the owner. We stay silent — but the response below is unchanged, so
        // the caller still cannot tell whether the address exists.
        boolean isLocalAccount = user != null
                && user.getProvider() != null
                && ProviderType.LOCAL.equals(user.getProvider().getProviderName());

        if (isLocalAccount) {
            // One live reset link at a time: issuing a new one kills the previous.
            passwordResetTokenRepository.deleteByEmail(request.getEmail());

            String token = UUID.randomUUID().toString();
            PasswordResetToken resetToken = PasswordResetToken.builder()
                    .token(token)
                    .email(request.getEmail())
                    .expiresAt(LocalDateTime.now().plusMinutes(resetTokenExpiryMinutes))
                    .used(false)
                    .build();
            passwordResetTokenRepository.save(resetToken);
            mailService.sendPasswordReset(request.getEmail(), token);
        }

        return ResponseEntity.ok(ApiResponse.success(null,
                "Si cette adresse est enregistrée, un lien de réinitialisation vient de t'être envoyé."));
    }

    @PostMapping("/reset-password")
    @Transactional
    @Operation(summary = "Reset password",
               description = "Reset the password using the token received by email.")
    public ResponseEntity<ApiResponse<Void>> resetPassword(
            @Valid @RequestBody ResetPasswordRequest request) {

        PasswordResetToken resetToken = passwordResetTokenRepository
                .findByTokenAndUsedFalse(request.getToken())
                .orElseThrow(() -> new BadRequestException(
                        "Ce lien de réinitialisation est invalide ou a déjà été utilisé."));

        if (resetToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new BadRequestException(
                    "Ce lien de réinitialisation a expiré. Merci d'en demander un nouveau.");
        }

        User user = userService.findByEmail(resetToken.getEmail());
        if (user == null) {
            throw new BadRequestException("Compte introuvable.");
        }

        PasswordValidator.validate(request.getNewPassword());

        userService.updatePassword(user, request.getNewPassword());
        resetToken.setUsed(true);
        passwordResetTokenRepository.save(resetToken);

        return ResponseEntity.ok(ApiResponse.success(null, "Mot de passe réinitialisé avec succès."));
    }

    @PostMapping("/logout")
    @Operation(summary = "Logout",
               description = "Revoke the current JWT so it cannot be reused, even before it expires.")
    @ApiResponses({
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200",
            description = "Logged out successfully"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401",
            description = "No valid token provided")
    })
    public ResponseEntity<ApiResponse<Void>> logout(
            HttpServletRequest request,
            HttpServletResponse httpResponse) {

        // The token may arrive in the Authorization header (API clients) or the
        // HttpOnly cookie (browser app). Revoke whichever one was used.
        String authHeader = request.getHeader("Authorization");
        String jwt = (authHeader != null && authHeader.startsWith("Bearer "))
                ? authHeader.substring(7)
                : authCookieService.read(request);

        if (jwt != null && !jwt.isBlank()) {
            try {
                String jti          = jwtService.extractJti(jwt);
                long   expirationMs = jwtService.extractExpiration(jwt).getTime();
                if (jti != null) {
                    tokenBlacklist.revoke(jti, expirationMs);
                }
            } catch (Exception ignored) {
                // Token is already invalid — logout succeeds anyway
            }
        }

        authCookieService.clear(httpResponse);
        SecurityContextHolder.clearContext();
        return ResponseEntity.ok(ApiResponse.success(null, "Déconnexion réussie."));
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private void enforceRateLimit(HttpServletRequest request, RateLimiterService.Limit limit) {
        String key = limit.name() + ":" + getClientIp(request);
        if (!rateLimiter.isAllowed(key, limit)) {
            throw new BadRequestException(
                    "Trop de requêtes. Réessaie dans quelques minutes.");
        }
    }

    /** Normalize an email for use as a stable rate-limit key. */
    private String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase();
    }

    private String getClientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
