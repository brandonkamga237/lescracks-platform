package com.brandonkamga.lescracks.identity.api;

import com.brandonkamga.lescracks.identity.api.dto.LinkIdentityRequest;
import com.brandonkamga.lescracks.identity.api.dto.UserIdentityResponse;
import com.brandonkamga.lescracks.identity.domain.member.AuthProvider;
import com.brandonkamga.lescracks.identity.domain.external.UserIdentityService;

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
        return ResponseEntity.ok(identities.list(authentication.getName()).stream().map(UserIdentityResponse::of).toList());
    }

    @PostMapping
    public ResponseEntity<UserIdentityResponse> link(Authentication authentication,
                                                     @Valid @RequestBody LinkIdentityRequest request) {
        return ResponseEntity.ok(UserIdentityResponse.of(
                identities.link(authentication.getName(), request.provider(), request.token())));
    }

    @DeleteMapping("/{provider}")
    public ResponseEntity<Void> unlink(Authentication authentication, @PathVariable AuthProvider provider) {
        identities.unlink(authentication.getName(), provider);
        return ResponseEntity.noContent().build();
    }
}
