package com.brandonkamga.lescracks.controller;

import com.brandonkamga.lescracks.domain.AuthProvider;
import com.brandonkamga.lescracks.dto.auth.LinkIdentityRequest;
import com.brandonkamga.lescracks.dto.user.UserIdentityResponse;
import com.brandonkamga.lescracks.service.interfaces.UserIdentityService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/me/identities")
public class UserIdentityController {

    private final UserIdentityService identities;

    public UserIdentityController(UserIdentityService identities) { this.identities = identities; }

    @GetMapping
    public ResponseEntity<List<UserIdentityResponse>> list(Authentication authentication) {
        return ResponseEntity.ok(identities.list(authentication.getName()));
    }

    @PostMapping
    public ResponseEntity<UserIdentityResponse> link(Authentication authentication,
                                                     @Valid @RequestBody LinkIdentityRequest request) {
        return ResponseEntity.ok(identities.link(authentication.getName(), request));
    }

    @DeleteMapping("/{provider}")
    public ResponseEntity<Void> unlink(Authentication authentication, @PathVariable AuthProvider provider) {
        identities.unlink(authentication.getName(), provider);
        return ResponseEntity.noContent().build();
    }
}
