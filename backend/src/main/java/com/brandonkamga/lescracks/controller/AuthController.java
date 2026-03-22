package com.brandonkamga.lescracks.controller;

import com.brandonkamga.lescracks.domain.Provider;
import com.brandonkamga.lescracks.domain.ProviderType;
import com.brandonkamga.lescracks.domain.Role;
import com.brandonkamga.lescracks.domain.RoleName;
import com.brandonkamga.lescracks.domain.User;
import com.brandonkamga.lescracks.dto.ApiResponse;
import com.brandonkamga.lescracks.dto.AuthResponse;
import com.brandonkamga.lescracks.dto.LoginRequest;
import com.brandonkamga.lescracks.dto.UserRequest;
import com.brandonkamga.lescracks.exception.BadRequestException;
import com.brandonkamga.lescracks.mapper.UserMapper;
import com.brandonkamga.lescracks.repository.ProviderRepository;
import com.brandonkamga.lescracks.repository.RoleRepository;
import com.brandonkamga.lescracks.security.jwt.JwtService;
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
import org.springframework.web.bind.annotation.*;

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

    public AuthController(
            UserService userService,
            UserMapper userMapper,
            JwtService jwtService,
            AuthenticationManager authenticationManager,
            PasswordEncoder passwordEncoder,
            RoleRepository roleRepository,
            ProviderRepository providerRepository) {
        this.userService = userService;
        this.userMapper = userMapper;
        this.jwtService = jwtService;
        this.authenticationManager = authenticationManager;
        this.passwordEncoder = passwordEncoder;
        this.roleRepository = roleRepository;
        this.providerRepository = providerRepository;
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
    public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody UserRequest userRequest) {
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

        // Get the LOCAL provider for local registration
        Provider localProvider = providerRepository.findByProviderName(ProviderType.LOCAL)
                .orElseThrow(() -> new RuntimeException("LOCAL provider not found"));

        User user = new User();
        user.setEmail(userRequest.getEmail());
        user.setUsername(userRequest.getUsername());
        user.setPassword(passwordEncoder.encode(userRequest.getPassword()));
        user.setRole(role);
        user.setPhone(userRequest.getPhone());
        user.setCountry(userRequest.getCountry());
        user.setProvider(localProvider);
        // Local users don't have a providerUserId
        user.setProviderUserId(null);

        User savedUser = userService.save(user);

        String token = jwtService.generateTokenForUser(savedUser.getEmail());

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success(AuthResponse.of(token, userMapper.toResponse(savedUser)), "User registered successfully"));
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

            String token = jwtService.generateTokenForUser(user.getEmail());

            return ResponseEntity.ok(ApiResponse.success(AuthResponse.of(token, userMapper.toResponse(user)), "Login successful"));
        } catch (BadCredentialsException e) {
            throw new BadRequestException("Invalid email or password");
        }
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
