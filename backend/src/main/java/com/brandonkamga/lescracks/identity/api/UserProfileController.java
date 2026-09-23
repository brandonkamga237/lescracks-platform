package com.brandonkamga.lescracks.identity.api;

import com.brandonkamga.lescracks.identity.api.dto.UserPasswordChangeRequest;
import com.brandonkamga.lescracks.identity.api.dto.UserProfileResponse;
import com.brandonkamga.lescracks.identity.api.dto.UserProfileUpdateRequest;
import com.brandonkamga.lescracks.identity.domain.User;
import com.brandonkamga.lescracks.identity.domain.UserIdentityService;
import com.brandonkamga.lescracks.identity.domain.UserProfileService;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;

import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/me")
public class UserProfileController {
    private final UserProfileService profiles;
    private final UserIdentityService identities;

    public UserProfileController(UserProfileService profiles, UserIdentityService identities) {
        this.profiles = profiles;
        this.identities = identities;
    }

    @GetMapping
    public UserProfileResponse get(Authentication authentication) {
        return response(profiles.require(authentication.getName()));
    }

    @PatchMapping
    public UserProfileResponse update(Authentication authentication,
                                      @Valid @RequestBody UserProfileUpdateRequest request) {
        return response(profiles.update(authentication.getName(), request));
    }

    @PostMapping(value = "/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public UserProfileResponse updateAvatar(Authentication authentication,
                                            @RequestParam("file") MultipartFile file) {
        return response(profiles.updateAvatar(authentication.getName(), file));
    }

    @PostMapping("/password")
    public ResponseEntity<Void> changePassword(Authentication authentication,
                                               @Valid @RequestBody UserPasswordChangeRequest request) {
        profiles.changePassword(authentication.getName(), request);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(Authentication authentication) { profiles.delete(authentication.getName()); }

    private UserProfileResponse response(User user) {
        return new UserProfileResponse(user.getId(), user.getEmail(), user.getFirstName(),
                user.getLastName(), user.getStatus(), user.isEmailVerified(), user.getProvider(), user.getCreatedAt(),
                user.getUsername(), user.getAvatarUrl(), user.getBio(), user.getLocation(), user.getSocialLinks(),
                identities.list(user.getEmail()));
    }
}
