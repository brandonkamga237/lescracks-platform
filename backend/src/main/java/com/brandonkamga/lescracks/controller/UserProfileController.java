package com.brandonkamga.lescracks.controller;

import com.brandonkamga.lescracks.domain.User;
import com.brandonkamga.lescracks.dto.user.UserProfileResponse;
import com.brandonkamga.lescracks.dto.user.UserProfileUpdateRequest;
import com.brandonkamga.lescracks.service.interfaces.UserProfileService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/me")
public class UserProfileController {
    private final UserProfileService profiles;

    public UserProfileController(UserProfileService profiles) { this.profiles = profiles; }

    @GetMapping
    public UserProfileResponse get(Authentication authentication) {
        return response(profiles.require(authentication.getName()));
    }

    @PatchMapping
    public UserProfileResponse update(Authentication authentication,
                                      @Valid @RequestBody UserProfileUpdateRequest request) {
        return response(profiles.update(authentication.getName(), request));
    }

    @DeleteMapping
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(Authentication authentication) { profiles.delete(authentication.getName()); }

    private UserProfileResponse response(User user) {
        return new UserProfileResponse(user.getId(), user.getEmail(), user.getFirstName(),
                user.getLastName(), user.getStatus(), user.isEmailVerified(), user.getCreatedAt());
    }
}