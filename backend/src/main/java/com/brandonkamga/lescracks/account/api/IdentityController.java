package com.brandonkamga.lescracks.account.api;

import com.brandonkamga.lescracks.account.api.dto.IdentityResponse;
import com.brandonkamga.lescracks.account.api.dto.LinkIdentityRequest;
import com.brandonkamga.lescracks.account.application.ExternalIdentityService;
import com.brandonkamga.lescracks.account.domain.model.AuthProvider;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/me/identities")
public class IdentityController {
    private final ExternalIdentityService identities;

    public IdentityController(ExternalIdentityService identities) { this.identities = identities; }

    @GetMapping
    public ResponseEntity<List<IdentityResponse>> list(Authentication authentication) {
        return ResponseEntity.ok(identities.list(authentication.getName()).stream().map(IdentityResponse::of).toList());
    }

    @PostMapping
    public ResponseEntity<IdentityResponse> link(Authentication authentication,
                                                 @Valid @RequestBody LinkIdentityRequest request) {
        return ResponseEntity.ok(IdentityResponse.of(
                identities.link(authentication.getName(), request.provider(), request.token())));
    }

    @DeleteMapping("/{provider}")
    public ResponseEntity<Void> unlink(Authentication authentication, @PathVariable AuthProvider provider) {
        identities.unlink(authentication.getName(), provider);
        return ResponseEntity.noContent().build();
    }
}
