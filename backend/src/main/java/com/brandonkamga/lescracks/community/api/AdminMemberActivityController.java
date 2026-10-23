package com.brandonkamga.lescracks.community.api;

import com.brandonkamga.lescracks.community.api.dto.MemberActivityResponse;
import com.brandonkamga.lescracks.community.application.MemberActivityService;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/users/{id}/activity")
@PreAuthorize("hasRole('ADMIN')")
public class AdminMemberActivityController {
    private final MemberActivityService activity;

    public AdminMemberActivityController(MemberActivityService activity) {
        this.activity = activity;
    }

    @GetMapping
    public MemberActivityResponse get(@PathVariable Long id) {
        return MemberActivityResponse.of(activity.view(id));
    }
}
