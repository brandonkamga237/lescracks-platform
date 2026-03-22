package com.brandonkamga.lescracks.controller;

import com.brandonkamga.lescracks.domain.PremiumRequest;
import com.brandonkamga.lescracks.domain.PremiumRequestStatus;
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

import java.util.Optional;

@RestController
@RequestMapping("/api/premium")
@Tag(name = "Premium", description = "Gestion des demandes de compte PREMIUM")
public class PremiumController {

    private final PremiumRequestService premiumRequestService;
    private final UserService userService;

    public PremiumController(PremiumRequestService premiumRequestService, UserService userService) {
        this.premiumRequestService = premiumRequestService;
        this.userService = userService;
    }

    @PostMapping("/request")
    @Operation(summary = "Soumettre une demande PREMIUM",
               description = "Permet à un utilisateur connecté de soumettre une demande de passage en compte PREMIUM.")
    public ResponseEntity<ApiResponse<PremiumRequestResponse>> submitRequest(
            @Valid @RequestBody PremiumRequestRequest request,
            Authentication authentication) {

        String email = authentication.getName();
        User user = userService.findByEmail(email);

        PremiumRequest saved = premiumRequestService.submitRequest(
                user.getId(),
                request.getWhatsappNumber(),
                request.getCountry(),
                request.getMessage()
        );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success(toResponse(saved), "Votre demande a été envoyée. Notre service client vous contactera sur WhatsApp."));
    }

    @GetMapping("/my-request")
    @Operation(summary = "Consulter ma dernière demande PREMIUM",
               description = "Retourne le statut de la dernière demande PREMIUM de l'utilisateur connecté.")
    public ResponseEntity<ApiResponse<PremiumRequestResponse>> getMyRequest(Authentication authentication) {
        String email = authentication.getName();
        User user = userService.findByEmail(email);

        Optional<PremiumRequest> latest = premiumRequestService.getLatestRequestByUser(user.getId());

        if (latest.isEmpty()) {
            return ResponseEntity.ok(ApiResponse.success(null, "Aucune demande trouvée"));
        }

        return ResponseEntity.ok(ApiResponse.success(toResponse(latest.get()), "Demande trouvée"));
    }

    // === ADMIN endpoints ===

    @GetMapping("/admin/requests")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "[ADMIN] Lister toutes les demandes PREMIUM")
    public ResponseEntity<ApiResponse<Page<PremiumRequestResponse>>> getAllRequests(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String status) {

        Pageable pageable = PageRequest.of(page, size);
        Page<PremiumRequest> requests;

        if (status != null && !status.isBlank()) {
            PremiumRequestStatus requestStatus = PremiumRequestStatus.valueOf(status.toUpperCase());
            requests = premiumRequestService.getRequestsByStatus(requestStatus, pageable);
        } else {
            requests = premiumRequestService.getAllRequests(pageable);
        }

        Page<PremiumRequestResponse> responsePage = requests.map(this::toResponse);
        return ResponseEntity.ok(ApiResponse.success(responsePage, "Liste des demandes PREMIUM"));
    }

    @PutMapping("/admin/requests/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "[ADMIN] Mettre à jour le statut d'une demande PREMIUM",
               description = "Quand le statut est PAID, l'utilisateur est automatiquement passé en PREMIUM.")
    public ResponseEntity<ApiResponse<PremiumRequestResponse>> updateRequestStatus(
            @PathVariable Long id,
            @RequestParam String status) {

        PremiumRequestStatus requestStatus = PremiumRequestStatus.valueOf(status.toUpperCase());
        PremiumRequest updated = premiumRequestService.updateRequestStatus(id, requestStatus);

        String message = requestStatus == PremiumRequestStatus.PAID
                ? "Paiement confirmé. Le compte utilisateur a été activé en PREMIUM."
                : "Statut mis à jour avec succès.";

        return ResponseEntity.ok(ApiResponse.success(toResponse(updated), message));
    }

    @GetMapping("/admin/stats")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "[ADMIN] Statistiques des demandes PREMIUM")
    public ResponseEntity<ApiResponse<java.util.Map<String, Long>>> getStats() {
        java.util.Map<String, Long> stats = new java.util.HashMap<>();
        stats.put("pending", premiumRequestService.countByStatus(PremiumRequestStatus.PENDING));
        stats.put("contacted", premiumRequestService.countByStatus(PremiumRequestStatus.CONTACTED));
        stats.put("paid", premiumRequestService.countByStatus(PremiumRequestStatus.PAID));
        stats.put("rejected", premiumRequestService.countByStatus(PremiumRequestStatus.REJECTED));
        return ResponseEntity.ok(ApiResponse.success(stats, "Statistiques des demandes PREMIUM"));
    }

    private PremiumRequestResponse toResponse(PremiumRequest request) {
        return PremiumRequestResponse.builder()
                .id(request.getId())
                .userId(request.getUser().getId())
                .username(request.getUser().getUsername())
                .email(request.getUser().getEmail())
                .whatsappNumber(request.getWhatsappNumber())
                .country(request.getCountry())
                .message(request.getMessage())
                .status(request.getStatus().name())
                .createdAt(request.getCreatedAt())
                .build();
    }
}
