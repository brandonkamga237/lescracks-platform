package com.brandonkamga.lescracks.controller;

import com.brandonkamga.lescracks.domain.ProviderType;
import com.brandonkamga.lescracks.domain.RoleName;
import com.brandonkamga.lescracks.domain.User;
import com.brandonkamga.lescracks.dto.ApiResponse;
import com.brandonkamga.lescracks.dto.ChangePasswordRequest;
import com.brandonkamga.lescracks.dto.UserRequest;
import com.brandonkamga.lescracks.dto.UserResponse;
import com.brandonkamga.lescracks.exception.BadRequestException;
import com.brandonkamga.lescracks.exception.ResourceNotFoundException;
import com.brandonkamga.lescracks.mapper.UserMapper;
import com.brandonkamga.lescracks.service.interfaces.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/users")
@Tag(name = "Users", description = "API de gestion des utilisateurs")
@SecurityRequirement(name = "bearerAuth")
public class UserController {

    private final UserService userService;
    private final UserMapper userMapper;

    public UserController(UserService userService, UserMapper userMapper) {
        this.userService = userService;
        this.userMapper = userMapper;
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Liste tous les utilisateurs", 
               description = "Retourne la liste de tous les utilisateurs. Réservé aux administrateurs.")
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", 
            description = "Liste des utilisateurs",
            content = @Content(mediaType = "application/json")),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", 
            description = "Accès interdit - Réservé aux administrateurs",
            content = @Content(mediaType = "application/json"))
    })
    public ResponseEntity<ApiResponse<List<UserResponse>>> getAllUsers() {
        List<UserResponse> users = userService.findAll().stream()
                .map(userMapper::toResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(users));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Récupérer un utilisateur par ID", 
               description = "Retourne les détails d'un utilisateur spécifique.")
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", 
            description = "Utilisateur trouvé",
            content = @Content(mediaType = "application/json")),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", 
            description = "Utilisateur non trouvé",
            content = @Content(mediaType = "application/json"))
    })
    public ResponseEntity<ApiResponse<UserResponse>> getUserById(
            @Parameter(description = "ID de l'utilisateur", required = true) @PathVariable Long id) {
        return userService.findByIdOptional(id)
                .map(user -> ResponseEntity.ok(ApiResponse.success(userMapper.toResponse(user))))
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));
    }

    @GetMapping("/me")
    @Operation(summary = "Récupérer l'utilisateur connecté", 
               description = "Retourne les informations de l'utilisateur actuellement connecté.")
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", 
            description = "Informations de l'utilisateur connecté",
            content = @Content(mediaType = "application/json")),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", 
            description = "Non authentifié",
            content = @Content(mediaType = "application/json"))
    })
    public ResponseEntity<ApiResponse<UserResponse>> getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new ResourceNotFoundException("User", "id", 0L);
        }
        
        User user = userService.findByEmail(authentication.getName());
        if (user == null) {
            throw new ResourceNotFoundException("User", "email", authentication.getName());
        }
        return ResponseEntity.ok(ApiResponse.success(userMapper.toResponse(user)));
    }

    @PutMapping("/me")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    @Operation(summary = "Mettre à jour le profil utilisateur", 
               description = "Met à jour les informations de l'utilisateur actuellement connecté.")
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", 
            description = "Profil mis à jour",
            content = @Content(mediaType = "application/json")),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", 
            description = "Données invalides",
            content = @Content(mediaType = "application/json")),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", 
            description = "Utilisateur non trouvé",
            content = @Content(mediaType = "application/json"))
    })
    public ResponseEntity<ApiResponse<UserResponse>> updateCurrentUser(@Valid @RequestBody UserRequest userRequest) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new ResourceNotFoundException("User", "id", 0L);
        }
        
        User currentUser = userService.findByEmail(authentication.getName());
        if (currentUser == null) {
            throw new ResourceNotFoundException("User", "email", authentication.getName());
        }

        // Validate unique fields
        if (userRequest.getEmail() != null && !userRequest.getEmail().equals(currentUser.getEmail()) 
            && userService.existsByEmailExcept(currentUser.getId(), userRequest.getEmail())) {
            throw new BadRequestException("Email already exists");
        }
        if (userRequest.getUsername() != null && !userRequest.getUsername().equals(currentUser.getUsername()) 
            && userService.existsByUsernameExcept(currentUser.getId(), userRequest.getUsername())) {
            throw new BadRequestException("Username already exists");
        }

        User updatedUser = userMapper.updateEntity(currentUser, userRequest);
        User savedUser = userService.save(updatedUser);

        return ResponseEntity.ok(ApiResponse.success(userMapper.toResponse(savedUser), "Profile updated successfully"));
    }

    @DeleteMapping("/me")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    @Operation(summary = "Supprimer son propre compte", 
               description = "Supprime le compte de l'utilisateur actuellement connecté.")
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", 
            description = "Compte supprimé",
            content = @Content(mediaType = "application/json")),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", 
            description = "Impossible de supprimer ce compte",
            content = @Content(mediaType = "application/json")),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", 
            description = "Utilisateur non trouvé",
            content = @Content(mediaType = "application/json"))
    })
    public ResponseEntity<ApiResponse<Void>> deleteCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new ResourceNotFoundException("User", "id", 0L);
        }
        
        User currentUser = userService.findByEmail(authentication.getName());
        if (currentUser == null) {
            throw new ResourceNotFoundException("User", "email", authentication.getName());
        }

        userService.deleteById(currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success(null, "Account deleted successfully"));
    }

    @GetMapping("/email/{email}")
    @Operation(summary = "Récupérer un utilisateur par email", 
               description = "Recherche un utilisateur par son adresse email.")
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", 
            description = "Utilisateur trouvé",
            content = @Content(mediaType = "application/json")),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", 
            description = "Utilisateur non trouvé",
            content = @Content(mediaType = "application/json"))
    })
    public ResponseEntity<ApiResponse<UserResponse>> getUserByEmail(
            @Parameter(description = "Email de l'utilisateur", required = true) @PathVariable String email) {
        User user = userService.findByEmail(email);
        if (user == null) {
            throw new ResourceNotFoundException("User", "email", email);
        }
        return ResponseEntity.ok(ApiResponse.success(userMapper.toResponse(user)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    @Operation(summary = "Mettre à jour un utilisateur", 
               description = "Met à jour les informations d'un utilisateur. L'utilisateur peut uniquement modifier son propre compte.")
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", 
            description = "Utilisateur mis à jour",
            content = @Content(mediaType = "application/json")),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", 
            description = "Données invalides",
            content = @Content(mediaType = "application/json")),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", 
            description = "Utilisateur non trouvé",
            content = @Content(mediaType = "application/json"))
    })
    public ResponseEntity<ApiResponse<UserResponse>> updateUser(
            @Parameter(description = "ID de l'utilisateur", required = true) @PathVariable Long id,
            @Valid @RequestBody UserRequest userRequest) {
        
        // Users can only update their own account, admins cannot update users
        if (!isCurrentUser(id)) {
            throw new BadRequestException("You can only update your own account");
        }

        if (!userService.findByIdOptional(id).isPresent()) {
            throw new ResourceNotFoundException("User", "id", id);
        }

        UserRequest validatedRequest = validateUpdateRequest(id, userRequest);
        User existingUser = userService.findById(id);
        User updatedUser = userMapper.updateEntity(existingUser, validatedRequest);
        User savedUser = userService.save(updatedUser);

        return ResponseEntity.ok(ApiResponse.success(userMapper.toResponse(savedUser), "User updated successfully"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    @Operation(summary = "Supprimer un utilisateur", 
               description = "Supprime un utilisateur. L'utilisateur peut uniquement supprimer son propre compte.")
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", 
            description = "Utilisateur supprimé",
            content = @Content(mediaType = "application/json")),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", 
            description = "Impossible de supprimer ce compte",
            content = @Content(mediaType = "application/json")),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", 
            description = "Utilisateur non trouvé",
            content = @Content(mediaType = "application/json"))
    })
    public ResponseEntity<ApiResponse<Void>> deleteUser(
            @Parameter(description = "ID de l'utilisateur", required = true) @PathVariable Long id) {
        if (!userService.findByIdOptional(id).isPresent()) {
            throw new ResourceNotFoundException("User", "id", id);
        }

        // Admins can delete any user, users can only delete their own account
        if (!isCurrentUser(id) && !isCurrentUserAdmin()) {
            throw new BadRequestException("You can only delete your own account");
        }

        userService.deleteById(id);
        return ResponseEntity.ok(ApiResponse.success(null, "User deleted successfully"));
    }

    private boolean isCurrentUser(Long userId) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return false;
        }
        
        User currentUser = userService.findByEmail(authentication.getName());
        return currentUser != null && currentUser.getId().equals(userId);
    }

    private boolean isCurrentUserAdmin() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return false;
        }
        return authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals(RoleName.admin.name()));
    }

    @PostMapping("/me/change-password")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    @Operation(summary = "Changer le mot de passe", 
               description = "Permet à l'utilisateur de changer son mot de passe.")
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", 
            description = "Mot de passe modifié avec succès",
            content = @Content(mediaType = "application/json")),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", 
            description = "Mot de passe actuel incorrect ou nouveau mot de passe invalide",
            content = @Content(mediaType = "application/json"))
    })
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @Parameter(description = "Request contenant le mot de passe actuel et le nouveau", required = true) 
            @RequestBody ChangePasswordRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new BadRequestException("Not authenticated");
        }
        
        User currentUser = userService.findByEmail(authentication.getName());
        if (currentUser == null) {
            throw new ResourceNotFoundException("User", "email", authentication.getName());
        }

        // Check if user can change password (LOCAL provider only)
        if (currentUser.getProvider() != null && 
            currentUser.getProvider().getProviderName() != ProviderType.LOCAL) {
            throw new BadRequestException("Cannot change password for OAuth users");
        }

        // Verify current password
        if (!userService.verifyPassword(currentUser, request.getCurrentPassword())) {
            throw new BadRequestException("Current password is incorrect");
        }

        // Validate new password
        if (request.getNewPassword() == null || request.getNewPassword().length() < 6) {
            throw new BadRequestException("New password must be at least 6 characters");
        }

        // Update password
        userService.updatePassword(currentUser, request.getNewPassword());

        return ResponseEntity.ok(ApiResponse.success(null, "Password changed successfully"));
    }

    private UserRequest validateUpdateRequest(Long id, UserRequest request) {
        if (request.getEmail() != null && userService.existsByEmailExcept(id, request.getEmail())) {
            throw new BadRequestException("Email already exists");
        }
        if (request.getUsername() != null && userService.existsByUsernameExcept(id, request.getUsername())) {
            throw new BadRequestException("Username already exists");
        }
        return request;
    }
}
