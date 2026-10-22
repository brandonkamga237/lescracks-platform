package com.brandonkamga.lescracks.member.api;

import com.brandonkamga.lescracks.account.application.ExternalIdentityService;
import com.brandonkamga.lescracks.member.api.dto.OnboardingRequest;
import com.brandonkamga.lescracks.member.api.dto.ProfileResponse;
import com.brandonkamga.lescracks.member.api.dto.ProfileUpdateRequest;
import com.brandonkamga.lescracks.member.application.MemberView;
import com.brandonkamga.lescracks.member.application.ProfileService;
import com.brandonkamga.lescracks.shared.exception.BadRequestException;

import jakarta.validation.Valid;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

/** The signed-in member's profile. Password, confirmation and closing the account are account's, under /api/me too. */
@RestController
@RequestMapping("/api/me")
public class ProfileController {
    private final ProfileService profiles;
    private final ExternalIdentityService identities;

    public ProfileController(ProfileService profiles, ExternalIdentityService identities) {
        this.profiles = profiles;
        this.identities = identities;
    }

    @GetMapping
    public ProfileResponse get(Authentication authentication) {
        return response(profiles.view(authentication.getName()));
    }

    @PatchMapping
    public ProfileResponse update(Authentication authentication, @Valid @RequestBody ProfileUpdateRequest request) {
        return response(profiles.update(authentication.getName(), request.toChanges()));
    }

    /** The welcome questions after sign-up: answered, partly answered or put off, it is never shown again. */
    @PutMapping("/onboarding")
    public ProfileResponse onboard(Authentication authentication, @Valid @RequestBody OnboardingRequest request) {
        return response(profiles.onboard(authentication.getName(), request.toAnswers()));
    }

    @PostMapping(value = "/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ProfileResponse updateAvatar(Authentication authentication, @RequestParam("file") MultipartFile file) {
        byte[] content;
        try {
            content = file.getBytes();
        } catch (IOException cause) {
            throw new BadRequestException("Impossible de lire le fichier.");
        }
        return response(profiles.updateAvatar(authentication.getName(), file.getOriginalFilename(), content));
    }

    @DeleteMapping("/avatar")
    public ProfileResponse removeAvatar(Authentication authentication) {
        return response(profiles.removeAvatar(authentication.getName()));
    }

    private ProfileResponse response(MemberView view) {
        return ProfileResponse.of(view, identities.list(view.account().getEmail()));
    }
}
