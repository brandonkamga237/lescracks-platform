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
import com.brandonkamga.lescracks.security.jwt.JwtService;
import com.brandonkamga.lescracks.service.impl.MailServiceImpl;
import com.brandonkamga.lescracks.service.interfaces.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
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
@Tag(name = "Authentication", description = "API d'authentification - Connexion, inscription et gestion de session")
public class AuthController {

    private final UserService userService;
    private final UserMapper userMapper;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final PasswordEncoder passwordEncoder;
    private final RoleRepository roleRepository;
    private final ProviderRepository providerRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final UserRepository userRepository;
    private final MailServiceImpl mailService;

    public AuthController(
            UserService userService,
            UserMapper userMapper,
            JwtService jwtService,
            AuthenticationManager authenticationManager,
            PasswordEncoder passwordEncoder,
            RoleRepository roleRepository,
            ProviderRepository providerRepository,
            PasswordResetTokenRepository passwordResetTokenRepository,
            UserRepository userRepository,
            MailServiceImpl mailService) {
        this.userService = userService;
        this.userMapper = userMapper;
        this.jwtService = jwtService;
        this.authenticationManager = authenticationManager;
        this.passwordEncoder = passwordEncoder;
        this.roleRepository = roleRepository;
        this.providerRepository = providerRepository;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
        this.userRepository = userRepository;
        this.mailService = mailService;
    }

    @PostMapping("/register")
    @Operation(summary = "Inscription d'un nouvel utilisateur", 
               description = "Crée un nouveau compte utilisateur avec email, username et mot de passe. " +
                           "Retourne un token JWT pour l'authentification immédiate.")
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "201", 
            description = "Utilisateur créé avec succès",
            content = @Content(mediaType = "application/json", 
                schema = @Schema(implementation = ApiResponse.class))),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", 
            description = "Données invalides ou email/username déjà utilisé",
            content = @Content(mediaType = "application/json"))
    })
    public ResponseEntity<ApiResponse<Void>> register(@Valid @RequestBody UserRequest userRequest) {
        if (userRequest.getEmail() == null || userService.existsByEmail(userRequest.getEmail())) {
            throw new BadRequestException("Email already exists or is required");
        }
        if (userRequest.getUsername() == null || userService.existsByUsername(userRequest.getUsername())) {
            throw new BadRequestException("Username already exists or is required");
        }
        if (userRequest.getPassword() == null || userRequest.getPassword().length() < 6) {
            throw new BadRequestException("Password is required and must be at least 6 characters");
        }

        Role role = roleRepository.findByName(RoleName.user)
                .orElseThrow(() -> new RuntimeException("Role not found"));

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

        User savedUser = userService.save(user);
        mailService.sendEmailVerification(savedUser.getEmail(), savedUser.getUsername(), verificationToken);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success(null, "Compte créé — vérifie ta boîte mail pour activer ton compte."));
    }

    @PostMapping("/verify-email")
    @Transactional
    @Operation(summary = "Vérification de l'adresse email",
               description = "Active le compte en vérifiant le token reçu par email.")
    public ResponseEntity<ApiResponse<AuthResponse>> verifyEmail(@RequestParam String token) {
        User user = userRepository.findByVerificationToken(token)
                .orElseThrow(() -> new BadRequestException("Lien de vérification invalide ou déjà utilisé."));

        user.setEmailVerified(true);
        user.setVerificationToken(null);
        userService.save(user);

        mailService.sendWelcome(user.getEmail(), user.getUsername());

        String jwt = jwtService.generateTokenForUser(user.getEmail());
        return ResponseEntity.ok(ApiResponse.success(
                AuthResponse.of(jwt, userMapper.toResponse(user)),
                "Email vérifié — bienvenue sur LesCracks !"));
    }

    @PostMapping("/login")
    @Operation(summary = "Connexion utilisateur", 
               description = "Authentifie un utilisateur avec son email et mot de passe. " +
                           "Retourne un token JWT à utiliser pour les requêtes authentifiées.")
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", 
            description = "Connexion réussie",
            content = @Content(mediaType = "application/json", 
                schema = @Schema(implementation = ApiResponse.class))),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", 
            description = "Email ou mot de passe invalide",
            content = @Content(mediaType = "application/json"))
    })
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest loginRequest) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(loginRequest.getEmail(), loginRequest.getPassword())
            );

            User user = userService.findByEmail(loginRequest.getEmail());
            if (user == null) {
                throw new BadRequestException("User not found");
            }

            // Block LOCAL users who haven't verified their email yet
            if (user.getProvider() != null
                    && ProviderType.LOCAL.equals(user.getProvider().getProviderName())
                    && !user.isEmailVerified()) {
                throw new BadRequestException("Vérifie ton adresse email avant de te connecter. Consulte ta boîte mail.");
            }

            String token = jwtService.generateTokenForUser(user.getEmail());

            return ResponseEntity.ok(ApiResponse.success(AuthResponse.of(token, userMapper.toResponse(user)), "Login successful"));
        } catch (BadCredentialsException e) {
            throw new BadRequestException("Invalid email or password");
        }
    }

    @PostMapping("/forgot-password")
    @Transactional
    @Operation(summary = "Demande de réinitialisation de mot de passe",
               description = "Envoie un email avec un lien de réinitialisation valable 30 minutes. " +
                           "Retourne toujours 200 pour ne pas révéler si l'email existe.")
    public ResponseEntity<ApiResponse<Void>> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        User user = userService.findByEmail(request.getEmail());
        if (user != null) {
            // Delete any existing tokens for this email
            passwordResetTokenRepository.deleteByEmail(request.getEmail());

            String token = UUID.randomUUID().toString();
            PasswordResetToken resetToken = PasswordResetToken.builder()
                    .token(token)
                    .email(request.getEmail())
                    .expiresAt(LocalDateTime.now().plusMinutes(30))
                    .used(false)
                    .build();
            passwordResetTokenRepository.save(resetToken);
            mailService.sendPasswordReset(request.getEmail(), token);
        }
        // Always 200 — don't reveal if email exists
        return ResponseEntity.ok(ApiResponse.success(null, "Si cet email est enregistré, un lien de réinitialisation a été envoyé."));
    }

    @PostMapping("/reset-password")
    @Transactional
    @Operation(summary = "Réinitialisation du mot de passe",
               description = "Réinitialise le mot de passe avec le token reçu par email.")
    public ResponseEntity<ApiResponse<Void>> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        PasswordResetToken resetToken = passwordResetTokenRepository
                .findByTokenAndUsedFalse(request.getToken())
                .orElseThrow(() -> new BadRequestException("Token invalide ou déjà utilisé"));

        if (resetToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new BadRequestException("Ce lien de réinitialisation a expiré");
        }

        User user = userService.findByEmail(resetToken.getEmail());
        if (user == null) {
            throw new BadRequestException("Utilisateur introuvable");
        }

        userService.updatePassword(user, request.getNewPassword());
        resetToken.setUsed(true);
        passwordResetTokenRepository.save(resetToken);

        return ResponseEntity.ok(ApiResponse.success(null, "Mot de passe réinitialisé avec succès"));
    }

    @PostMapping("/logout")
    @Operation(summary = "Déconnexion",
               description = "Déconnecte l'utilisateur en cours et invalide la session HTTP.")
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", 
            description = "Déconnexion réussie",
            content = @Content(mediaType = "application/json"))
    })
    public ResponseEntity<ApiResponse<Void>> logout(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session != null) {
            session.invalidate();
        }
        SecurityContextHolder.clearContext();
        return ResponseEntity.ok(ApiResponse.success(null, "Logged out successfully"));
    }
}
