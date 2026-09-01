package com.brandonkamga.lescracks.controller;

import com.brandonkamga.lescracks.domain.ProviderType;
import com.brandonkamga.lescracks.domain.User;
import com.brandonkamga.lescracks.dto.ApiResponse;
import com.brandonkamga.lescracks.dto.ChangePasswordRequest;
import com.brandonkamga.lescracks.dto.UserRequest;
import com.brandonkamga.lescracks.dto.UserResponse;
import com.brandonkamga.lescracks.exception.BadRequestException;
import com.brandonkamga.lescracks.exception.ResourceNotFoundException;
import com.brandonkamga.lescracks.mapper.UserMapper;
import com.brandonkamga.lescracks.service.interfaces.UserService;
import com.brandonkamga.lescracks.security.Authorities;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/users")
@Tag(name = "Users", description = "API de gestion des utilisateurs")
@SecurityRequirement(name = "bearerAuth")
public class UserController {

    private static final long MAX_AVATAR_SIZE = 5 * 1024 * 1024; // 5 MB
    private static final List<String> ALLOWED_TYPES = List.of("image/jpeg", "image/png", "image/webp", "image/gif");

    private final UserService userService;
    private final UserMapper userMapper;

    @Value("${app.uploads.dir:uploads/resources}")
    private String uploadsDir;

    @Value("${app.uploads.avatar-dir:uploads/avatars}")
    private String avatarDirPath;

    public UserController(UserService userService, UserMapper userMapper) {
        this.userService = userService;
        this.userMapper = userMapper;
    }

    private Path resolvedAvatarDir() {
        Path p = Paths.get(avatarDirPath);
        return p.isAbsolute() ? p : p.toAbsolutePath();
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
    @PreAuthorize("isAuthenticated()")
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

        // Prevent self-role modification: users cannot change their own role
        userRequest.setRoleName(null);

        User updatedUser = userMapper.updateEntity(currentUser, userRequest);
        User savedUser = userService.save(updatedUser);

        return ResponseEntity.ok(ApiResponse.success(userMapper.toResponse(savedUser), "Profile updated successfully"));
    }

    @DeleteMapping("/me")
    @PreAuthorize("isAuthenticated()")
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






    @PostMapping(value = "/me/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Mettre à jour la photo de profil",
               description = "Upload une image (JPEG/PNG/WebP/GIF, max 5 Mo) et la définit comme photo de profil.")
    public ResponseEntity<ApiResponse<UserResponse>> uploadAvatar(
            @RequestParam MultipartFile file) throws IOException {

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        User currentUser = userService.findByEmail(authentication.getName());
        if (currentUser == null) {
            throw new ResourceNotFoundException("User", "email", authentication.getName());
        }

        if (file.isEmpty()) {
            throw new BadRequestException("Le fichier est vide");
        }
        if (file.getSize() > MAX_AVATAR_SIZE) {
            throw new BadRequestException("Le fichier dépasse la taille maximale autorisée (5 Mo)");
        }
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_TYPES.contains(contentType)) {
            throw new BadRequestException("Format non supporté. Utilisez JPEG, PNG, WebP ou GIF.");
        }

        // Store file under the configured avatar directory
        Path avatarDir = resolvedAvatarDir();
        Files.createDirectories(avatarDir);

        String ext = "";
        String original = file.getOriginalFilename();
        if (original != null && original.contains(".")) {
            ext = original.substring(original.lastIndexOf('.'));
        }
        String filename = UUID.randomUUID() + ext;
        Files.write(avatarDir.resolve(filename), file.getBytes());

        currentUser.setPictureUrl("/api/users/avatars/" + filename);
        User saved = userService.save(currentUser);

        return ResponseEntity.ok(ApiResponse.success(userMapper.toResponse(saved), "Photo de profil mise à jour"));
    }

    @GetMapping("/avatars/{filename:.+}")
    @Operation(summary = "Récupérer un avatar",
               description = "Sert les photos de profil uploadées.")
    public ResponseEntity<org.springframework.core.io.Resource> serveAvatar(
            @PathVariable String filename) throws MalformedURLException {
        Path avatarDir = resolvedAvatarDir().normalize();
        Path filePath  = avatarDir.resolve(filename).normalize();

        // Prevent path traversal: the resolved path must stay inside the avatar directory.
        if (!filePath.startsWith(avatarDir)) {
            throw new BadRequestException("Invalid file path");
        }

        org.springframework.core.io.Resource resource = new UrlResource(filePath.toUri());
        if (!resource.exists()) {
            throw new ResourceNotFoundException("Avatar", "filename", filename);
        }
        String contentType = "application/octet-stream";
        try {
            contentType = Files.probeContentType(filePath);
            if (contentType == null) contentType = "application/octet-stream";
        } catch (IOException ignored) {}

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
                .contentType(MediaType.parseMediaType(contentType))
                .body(resource);
    }

    @PostMapping("/me/change-password")
    @PreAuthorize("isAuthenticated()")
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

        return ResponseEntity.ok(ApiResponse.success(null, "Mot de passe modifié. Toutes tes autres sessions ont été déconnectées."));
    }

}
