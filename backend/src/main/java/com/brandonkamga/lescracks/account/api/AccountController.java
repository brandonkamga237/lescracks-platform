package com.brandonkamga.lescracks.account.api;

import com.brandonkamga.lescracks.account.api.dto.PasswordChangeRequest;
import com.brandonkamga.lescracks.account.application.AccountSettingsService;
import com.brandonkamga.lescracks.account.application.EmailVerificationService;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

/** The signed-in member's own account: password, address confirmation, closing it. The profile is under /api/me too, in member. */
@RestController
@RequestMapping("/api/me")
public class AccountController {
    private final AccountSettingsService settings;
    private final EmailVerificationService verification;

    public AccountController(AccountSettingsService settings, EmailVerificationService verification) {
        this.settings = settings;
        this.verification = verification;
    }

    @PostMapping("/verification-email")
    public ResponseEntity<Void> resendVerification(Authentication authentication) {
        verification.sendAgain(authentication.getName());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/password")
    public ResponseEntity<Void> changePassword(Authentication authentication,
                                               @Valid @RequestBody PasswordChangeRequest request) {
        settings.changePassword(authentication.getName(), request.toChange());
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void close(Authentication authentication) { settings.close(authentication.getName()); }
}
