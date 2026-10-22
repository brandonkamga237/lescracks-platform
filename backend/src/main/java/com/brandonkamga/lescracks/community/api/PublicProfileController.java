package com.brandonkamga.lescracks.community.api;

import com.brandonkamga.lescracks.community.api.dto.PublicProfileResponse;
import com.brandonkamga.lescracks.community.application.PublicProfileService;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/members")
public class PublicProfileController {
    private final PublicProfileService profiles;

    public PublicProfileController(PublicProfileService profiles) {
        this.profiles = profiles;
    }

    /** Public: what a click on a member's name shows. */
    @GetMapping("/{id}")
    public PublicProfileResponse profile(@PathVariable Long id) {
        return PublicProfileResponse.of(profiles.require(id));
    }
}
