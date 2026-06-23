package com.brandonkamga.lescracks.controller;

import com.brandonkamga.lescracks.domain.PremiumRequest;
import com.brandonkamga.lescracks.domain.User;
import com.brandonkamga.lescracks.dto.ApiResponse;
import com.brandonkamga.lescracks.dto.PremiumRequestRequest;
import com.brandonkamga.lescracks.dto.PremiumRequestResponse;
import com.brandonkamga.lescracks.service.interfaces.PremiumRequestService;
import com.brandonkamga.lescracks.service.interfaces.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/premium")
@Tag(name = "Premium", description = "Premium account request management")
public class PremiumController {

    private final PremiumRequestService premiumRequestService;
    private final UserService userService;

    public PremiumController(PremiumRequestService premiumRequestService, UserService userService) {
        this.premiumRequestService = premiumRequestService;
        this.userService = userService;
    }

    @PostMapping("/request")
    @Operation(summary = "Submit a PREMIUM account request",
               description = "Allows a logged-in user to submit a request to upgrade to a PREMIUM account.")
    public ResponseEntity<ApiResponse<PremiumRequestResponse>> submitRequest(
            @Valid @RequestBody PremiumRequestRequest request,
            Authentication authentication) {

        String email = authentication.getName();
        User user = userService.findByEmail(email);

        PremiumRequest saved = premiumRequestService.submitRequest(
                user.getId(),
                request.getWhatsappNumber(),
                request.getContactEmail(),
                request.getCountry(),
                request.getMessage()
        );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success(toResponse(saved), "Your request has been submitted. Our team will contact you on WhatsApp."));
    }

    @GetMapping("/my-request")
    @Operation(summary = "View my current PREMIUM request",
               description = "Returns the pending PREMIUM request for the logged-in user, if it exists.")
    public ResponseEntity<ApiResponse<PremiumRequestResponse>> getMyRequest(Authentication authentication) {
        String email = authentication.getName();
        User user = userService.findByEmail(email);

        Optional<PremiumRequest> pending = premiumRequestService.getPendingRequestByUser(user.getId());

        if (pending.isEmpty()) {
            return ResponseEntity.ok(ApiResponse.success(null, "No pending request"));
        }

        return ResponseEntity.ok(ApiResponse.success(toResponse(pending.get()), "Pending request found"));
    }

    // === ADMIN endpoints ===

    @GetMapping("/admin/requests")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "[ADMIN] List all pending PREMIUM requests")
    public ResponseEntity<ApiResponse<Page<PremiumRequestResponse>>> getAllRequests(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        Pageable pageable = PageRequest.of(page, size);
        Page<PremiumRequestResponse> responsePage = premiumRequestService.getAllRequests(pageable).map(this::toResponse);
        return ResponseEntity.ok(ApiResponse.success(responsePage, "Pending PREMIUM requests"));
    }

    @PostMapping("/admin/requests/{id}/accept")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "[ADMIN] Accept a PREMIUM request",
               description = "Activates the PREMIUM account for the specified duration (in months), sends the confirmation email, then deletes the request.")
    public ResponseEntity<ApiResponse<Void>> acceptRequest(
            @PathVariable Long id,
            @RequestParam int months) {

        premiumRequestService.acceptRequest(id, months);
        return ResponseEntity.ok(ApiResponse.success(null, "PREMIUM account activated for " + months + " month(s)."));
    }

    @DeleteMapping("/admin/requests/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "[ADMIN] Reject/delete a PREMIUM request",
               description = "Deletes the request without further action. Rejection is handled directly on WhatsApp.")
    public ResponseEntity<ApiResponse<Void>> rejectRequest(@PathVariable Long id) {
        premiumRequestService.rejectRequest(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Request deleted."));
    }

    @GetMapping("/admin/stats")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "[ADMIN] PREMIUM request statistics")
    public ResponseEntity<ApiResponse<Map<String, Long>>> getStats() {
        Map<String, Long> stats = Map.of("pending", premiumRequestService.countPending());
        return ResponseEntity.ok(ApiResponse.success(stats, "PREMIUM request statistics"));
    }

    private PremiumRequestResponse toResponse(PremiumRequest request) {
        return PremiumRequestResponse.builder()
                .id(request.getId())
                .userId(request.getUser().getId())
                .username(request.getUser().getUsername())
                .email(request.getUser().getEmail())
                .whatsappNumber(request.getWhatsappNumber())
                .contactEmail(request.getContactEmail())
                .country(request.getCountry())
                .message(request.getMessage())
                .createdAt(request.getCreatedAt())
                .build();
    }
}
