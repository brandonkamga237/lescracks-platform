package com.brandonkamga.lescracks.identity.api;

import com.brandonkamga.lescracks.identity.api.dto.OnboardingRequest;
import com.brandonkamga.lescracks.identity.api.dto.UserPasswordChangeRequest;
import com.brandonkamga.lescracks.identity.api.dto.UserProfileResponse;
import com.brandonkamga.lescracks.identity.api.dto.UserProfileUpdateRequest;
import com.brandonkamga.lescracks.identity.domain.credential.PasswordService;
import com.brandonkamga.lescracks.identity.domain.external.UserIdentityService;
import com.brandonkamga.lescracks.identity.domain.member.User;
import com.brandonkamga.lescracks.identity.domain.member.UserProfileService;
import com.brandonkamga.lescracks.identity.domain.signup.EmailVerificationService;
import com.brandonkamga.lescracks.shared.exception.BadRequestException;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;

import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@RestController
@RequestMapping("/api/me")
public class UserProfileController {
    private final UserProfileService profiles;
    private final UserIdentityService identities;
    private final EmailVerificationService verification;
    private final PasswordService passwords;

    public UserProfileController(UserProfileService profiles, UserIdentityService identities,
                                 EmailVerificationService verification, PasswordService passwords) {
        this.profiles = profiles;
        this.identities = identities;
        this.verification = verification;
        this.passwords = passwords;
    }

    @GetMapping
    public UserProfileResponse get(Authentication authentication) {
        return response(profiles.require(authentication.getName()));
    }

    @PatchMapping
    public UserProfileResponse update(Authentication authentication,
                                      @Valid @RequestBody UserProfileUpdateRequest request) {
        return response(profiles.update(authentication.getName(), request.toChanges()));
    }

    /** The welcome questions after sign-up: answered, partly answered or put off, it is never shown again. */
    @PutMapping("/onboarding")
    public UserProfileResponse onboard(Authentication authentication, @Valid @RequestBody OnboardingRequest request) {
        return response(profiles.onboard(authentication.getName(), request.toAnswers()));
    }

    @PostMapping(value = "/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public UserProfileResponse updateAvatar(Authentication authentication,
                                            @RequestParam("file") MultipartFile file) {
        byte[] content;
        try {
            content = file.getBytes();
        } catch (IOException cause) {
            throw new BadRequestException("Impossible de lire le fichier.");
        }
        return response(profiles.updateAvatar(authentication.getName(), file.getOriginalFilename(), content));
    }

    @DeleteMapping("/avatar")
    public UserProfileResponse removeAvatar(Authentication authentication) {
        return response(profiles.removeAvatar(authentication.getName()));
    }

    @PostMapping("/verification-email")
    public ResponseEntity<Void> resendVerification(Authentication authentication) {
        verification.sendAgain(authentication.getName());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/password")
    public ResponseEntity<Void> changePassword(Authentication authentication,
                                               @Valid @RequestBody UserPasswordChangeRequest request) {
        passwords.change(authentication.getName(), request.toChange());
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(Authentication authentication) { profiles.delete(authentication.getName()); }

    private UserProfileResponse response(User user) {
        return UserProfileResponse.of(user, identities.list(user.getEmail()));
    }
}
