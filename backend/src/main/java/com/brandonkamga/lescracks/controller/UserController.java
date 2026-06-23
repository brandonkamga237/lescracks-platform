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
import com.brandonkamga.lescracks.util.PasswordValidator;
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
@Tag(name = "Users", description = "User management API")
@SecurityRequirement(name = "bearerAuth")
public class UserController {

    private static final long MAX_AVATAR_SIZE = 5 * 1024 * 1024L; // 5 MB
    private static final List<String> ALLOWED_TYPES =
            List.of("image/jpeg", "image/png", "image/webp", "image/gif");

    private final UserService userService;
    private final UserMapper  userMapper;

    @Value("${app.uploads.dir:uploads/resources}")
    private String uploadsDir;

    public UserController(UserService userService, UserMapper userMapper) {
        this.userService = userService;
        this.userMapper  = userMapper;
    }

    // -------------------------------------------------------------------------
    // Admin endpoints
    // -------------------------------------------------------------------------

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "List all users", description = "Returns all users. Admin only.")
    @ApiResponses({
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200",
            description = "User list", content = @Content(mediaType = "application/json")),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403",
            description = "Forbidden — admin role required")
    })
    public ResponseEntity<ApiResponse<List<UserResponse>>> getAllUsers() {
        List<UserResponse> users = userService.findAll().stream()
                .map(userMapper::toResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(users));
    }

    // -------------------------------------------------------------------------
    // Authenticated-user endpoints
    // -------------------------------------------------------------------------

    @GetMapping("/{id}")
    @PreAuthorize("@userSecurity.isSelf(#id) or hasRole('ADMIN')")
    @Operation(summary = "Get user by ID",
               description = "Returns user details. Only the account owner or an admin may call this.")
    @ApiResponses({
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200",
            description = "User found"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403",
            description = "Forbidden"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404",
            description = "User not found")
    })
    public ResponseEntity<ApiResponse<UserResponse>> getUserById(
            @Parameter(description = "User ID", required = true) @PathVariable Long id) {
        return userService.findByIdOptional(id)
                .map(user -> ResponseEntity.ok(ApiResponse.success(userMapper.toResponse(user))))
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));
    }

    @GetMapping("/me")
    @Operation(summary = "Get current user",
               description = "Returns the profile of the currently authenticated user.")
    @ApiResponses({
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200",
            description = "Current user"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401",
            description = "Unauthenticated")
    })
    public ResponseEntity<ApiResponse<UserResponse>> getCurrentUser() {
        User user = resolveCurrentUser();
        return ResponseEntity.ok(ApiResponse.success(userMapper.toResponse(user)));
    }

    @PutMapping("/me")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Update current user profile",
               description = "Update the authenticated user's own profile.")
    @ApiResponses({
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200",
            description = "Profile updated"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400",
            description = "Invalid data"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404",
            description = "User not found")
    })
    public ResponseEntity<ApiResponse<UserResponse>> updateCurrentUser(
            @Valid @RequestBody UserRequest userRequest) {

        User currentUser = resolveCurrentUser();

        if (userRequest.getEmail() != null
                && !userRequest.getEmail().equals(currentUser.getEmail())
                && userService.existsByEmailExcept(currentUser.getId(), userRequest.getEmail())) {
            throw new BadRequestException("Email is already in use");
        }
        if (userRequest.getUsername() != null
                && !userRequest.getUsername().equals(currentUser.getUsername())
                && userService.existsByUsernameExcept(currentUser.getId(), userRequest.getUsername())) {
            throw new BadRequestException("Username is already taken");
        }

        // Users cannot promote themselves
        userRequest.setRoleName(null);

        User updatedUser = userMapper.updateEntity(currentUser, userRequest);
        User savedUser   = userService.save(updatedUser);

        return ResponseEntity.ok(
                ApiResponse.success(userMapper.toResponse(savedUser), "Profile updated successfully"));
    }

    @DeleteMapping("/me")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Delete own account",
               description = "Permanently delete the authenticated user's account.")
    @ApiResponses({
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200",
            description = "Account deleted"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404",
            description = "User not found")
    })
    public ResponseEntity<ApiResponse<Void>> deleteCurrentUser() {
        User currentUser = resolveCurrentUser();
        userService.deleteById(currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success(null, "Account deleted successfully"));
    }

    @GetMapping("/email/{email}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get user by email",
               description = "Look up a user by email address. Admin only.")
    @ApiResponses({
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200",
            description = "User found"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403",
            description = "Forbidden — admin role required"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404",
            description = "User not found")
    })
    public ResponseEntity<ApiResponse<UserResponse>> getUserByEmail(
            @Parameter(description = "User email", required = true) @PathVariable String email) {
        User user = userService.findByEmail(email);
        if (user == null) {
            throw new ResourceNotFoundException("User", "email", email);
        }
        return ResponseEntity.ok(ApiResponse.success(userMapper.toResponse(user)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    @Operation(summary = "Update a user",
               description = "Update a user account. Users may only update their own account.")
    @ApiResponses({
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200",
            description = "User updated"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400",
            description = "Invalid data"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403",
            description = "Forbidden"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404",
            description = "User not found")
    })
    public ResponseEntity<ApiResponse<UserResponse>> updateUser(
            @Parameter(description = "User ID", required = true) @PathVariable Long id,
            @Valid @RequestBody UserRequest userRequest) {

        if (!isCurrentUser(id)) {
            throw new BadRequestException("You can only update your own account");
        }

        User existingUser = userService.findByIdOptional(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));

        UserRequest validated = validateUpdateRequest(id, userRequest);
        User updatedUser      = userMapper.updateEntity(existingUser, validated);
        User savedUser        = userService.save(updatedUser);

        return ResponseEntity.ok(
                ApiResponse.success(userMapper.toResponse(savedUser), "User updated successfully"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('USER') or hasRole('ADMIN')")
    @Operation(summary = "Delete a user",
               description = "Delete a user account. Users may only delete their own account; "
                           + "admins may delete any account.")
    @ApiResponses({
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200",
            description = "User deleted"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403",
            description = "Forbidden"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404",
            description = "User not found")
    })
    public ResponseEntity<ApiResponse<Void>> deleteUser(
            @Parameter(description = "User ID", required = true) @PathVariable Long id) {

        userService.findByIdOptional(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));

        if (!isCurrentUser(id) && !isCurrentUserAdmin()) {
            throw new BadRequestException("You can only delete your own account");
        }

        userService.deleteById(id);
        return ResponseEntity.ok(ApiResponse.success(null, "User deleted successfully"));
    }

    // -------------------------------------------------------------------------
    // Avatar
    // -------------------------------------------------------------------------

    @PostMapping(value = "/me/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Upload profile picture",
               description = "Upload an image (JPEG/PNG/WebP/GIF, max 5 MB) to use as a profile picture.")
    public ResponseEntity<ApiResponse<UserResponse>> uploadAvatar(
            @RequestParam MultipartFile file) throws IOException {

        User currentUser = resolveCurrentUser();

        if (file.isEmpty()) {
            throw new BadRequestException("File is empty");
        }
        if (file.getSize() > MAX_AVATAR_SIZE) {
            throw new BadRequestException("File exceeds the maximum allowed size of 5 MB");
        }
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_TYPES.contains(contentType)) {
            throw new BadRequestException(
                    "Unsupported file format. Please use JPEG, PNG, WebP or GIF.");
        }

        Path avatarDir = Paths.get(uploadsDir).getParent().resolve("avatars")
                .toAbsolutePath().normalize();
        Files.createDirectories(avatarDir);

        String ext      = extractSafeExtension(file.getOriginalFilename());
        String filename = UUID.randomUUID() + ext;
        Files.write(avatarDir.resolve(filename), file.getBytes());

        currentUser.setPictureUrl("/api/users/avatars/" + filename);
        User saved = userService.save(currentUser);

        return ResponseEntity.ok(
                ApiResponse.success(userMapper.toResponse(saved), "Profile picture updated"));
    }

    @GetMapping("/avatars/{filename:.+}")
    @Operation(summary = "Serve avatar",
               description = "Serve an uploaded profile picture.")
    public ResponseEntity<org.springframework.core.io.Resource> serveAvatar(
            @PathVariable String filename) throws MalformedURLException {

        Path avatarDir = Paths.get(uploadsDir).getParent().resolve("avatars")
                .toAbsolutePath().normalize();
        Path filePath  = avatarDir.resolve(filename).normalize();

        // Prevent path traversal: resolved path must stay inside avatarDir
        if (!filePath.startsWith(avatarDir)) {
            throw new BadRequestException("Invalid file path");
        }

        org.springframework.core.io.Resource resource = new UrlResource(filePath.toUri());
        if (!resource.exists()) {
            throw new ResourceNotFoundException("Avatar", "filename", filename);
        }

        String contentType = "application/octet-stream";
        try {
            String probed = Files.probeContentType(filePath);
            if (probed != null) contentType = probed;
        } catch (IOException ignored) {}

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
                .contentType(MediaType.parseMediaType(contentType))
                .body(resource);
    }

    // -------------------------------------------------------------------------
    // Password management
    // -------------------------------------------------------------------------

    @PostMapping("/me/change-password")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Change password",
               description = "Change the current user's password. Only available for local accounts.")
    @ApiResponses({
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200",
            description = "Password changed successfully"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400",
            description = "Current password incorrect or new password does not meet requirements")
    })
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @Valid @RequestBody ChangePasswordRequest request) {

        User currentUser = resolveCurrentUser();

        if (currentUser.getProvider() != null
                && currentUser.getProvider().getProviderName() != ProviderType.LOCAL) {
            throw new BadRequestException("Password cannot be changed for OAuth accounts");
        }

        if (!userService.verifyPassword(currentUser, request.getCurrentPassword())) {
            throw new BadRequestException("Current password is incorrect");
        }

        PasswordValidator.validate(request.getNewPassword());

        userService.updatePassword(currentUser, request.getNewPassword());

        return ResponseEntity.ok(ApiResponse.success(null, "Password changed successfully"));
    }

    // -------------------------------------------------------------------------
    // Private helpers
    // -------------------------------------------------------------------------

    private User resolveCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            throw new ResourceNotFoundException("User", "principal", "anonymous");
        }
        User user = userService.findByEmail(auth.getName());
        if (user == null) {
            throw new ResourceNotFoundException("User", "email", auth.getName());
        }
        return user;
    }

    private boolean isCurrentUser(Long userId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) return false;
        User currentUser = userService.findByEmail(auth.getName());
        return currentUser != null && currentUser.getId().equals(userId);
    }

    private boolean isCurrentUserAdmin() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) return false;
        return auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
    }

    private UserRequest validateUpdateRequest(Long id, UserRequest request) {
        if (request.getEmail() != null && userService.existsByEmailExcept(id, request.getEmail())) {
            throw new BadRequestException("Email is already in use");
        }
        if (request.getUsername() != null && userService.existsByUsernameExcept(id, request.getUsername())) {
            throw new BadRequestException("Username is already taken");
        }
        return request;
    }

    /** Extract only the file extension from an original filename, returning "" if absent. */
    private String extractSafeExtension(String originalFilename) {
        if (originalFilename == null || !originalFilename.contains(".")) {
            return "";
        }
        String ext = originalFilename.substring(originalFilename.lastIndexOf('.'));
        // Allow only safe extensions; drop anything unexpected
        return ext.matches("\\.[a-zA-Z0-9]{1,10}") ? ext : "";
    }
}
