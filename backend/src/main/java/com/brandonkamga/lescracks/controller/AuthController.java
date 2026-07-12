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
            MailServiceImpl mailService) {
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
    public ResponseEntity<ApiResponse<AuthResponse>> verifyEmail(@RequestParam String token) {
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
        return ResponseEntity.ok(ApiResponse.success(
                AuthResponse.of(jwt, userMapper.toResponse(user)),
                "Adresse email confirmée — bienvenue chez LesCracks !"));
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
            HttpServletRequest request) {

        String rateLimitKey = "LOGIN:" + getClientIp(request);
        if (!rateLimiter.isAllowed(rateLimitKey, RateLimiterService.Limit.LOGIN)) {
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

            // Reset rate-limit counter on successful login
            rateLimiter.reset(rateLimitKey);

            String token = jwtService.generateTokenForUser(user.getEmail());
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

        User user = userService.findByEmail(request.getEmail());
        if (user != null) {
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
    public ResponseEntity<ApiResponse<Void>> logout(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String jwt = authHeader.substring(7);
            try {
                String jti            = jwtService.extractJti(jwt);
                long   expirationMs   = jwtService.extractExpiration(jwt).getTime();
                if (jti != null) {
                    tokenBlacklist.revoke(jti, expirationMs);
                }
            } catch (Exception ignored) {
                // Token is already invalid — logout succeeds anyway
            }
        }

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

    private String getClientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
