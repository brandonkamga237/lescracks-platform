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
                request.getContactEmail(),
                request.getCountry(),
                request.getMessage()
        );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success(toResponse(saved), "Votre demande a été envoyée. Notre équipe vous contactera sur WhatsApp."));
    }

    @GetMapping("/my-request")
    @Operation(summary = "Consulter ma demande PREMIUM en cours",
               description = "Retourne la demande PREMIUM en attente de l'utilisateur connecté, si elle existe.")
    public ResponseEntity<ApiResponse<PremiumRequestResponse>> getMyRequest(Authentication authentication) {
        String email = authentication.getName();
        User user = userService.findByEmail(email);

        Optional<PremiumRequest> pending = premiumRequestService.getPendingRequestByUser(user.getId());

        if (pending.isEmpty()) {
            return ResponseEntity.ok(ApiResponse.success(null, "Aucune demande en cours"));
        }

        return ResponseEntity.ok(ApiResponse.success(toResponse(pending.get()), "Demande en cours trouvée"));
    }

    // === ADMIN endpoints ===

    @GetMapping("/admin/requests")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "[ADMIN] Lister toutes les demandes PREMIUM en attente")
    public ResponseEntity<ApiResponse<Page<PremiumRequestResponse>>> getAllRequests(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        Pageable pageable = PageRequest.of(page, size);
        Page<PremiumRequestResponse> responsePage = premiumRequestService.getAllRequests(pageable).map(this::toResponse);
        return ResponseEntity.ok(ApiResponse.success(responsePage, "Liste des demandes PREMIUM en attente"));
    }

    @PostMapping("/admin/requests/{id}/accept")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "[ADMIN] Accepter une demande PREMIUM",
               description = "Active le compte PREMIUM pour la durée spécifiée (en mois), envoie l'email de confirmation, puis supprime la demande.")
    public ResponseEntity<ApiResponse<Void>> acceptRequest(
            @PathVariable Long id,
            @RequestParam int months) {

        premiumRequestService.acceptRequest(id, months);
        return ResponseEntity.ok(ApiResponse.success(null, "Compte PREMIUM activé pour " + months + " mois."));
    }

    @DeleteMapping("/admin/requests/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "[ADMIN] Rejeter/supprimer une demande PREMIUM",
               description = "Supprime la demande sans action supplémentaire. Le refus est géré directement sur WhatsApp.")
    public ResponseEntity<ApiResponse<Void>> rejectRequest(@PathVariable Long id) {
        premiumRequestService.rejectRequest(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Demande supprimée."));
    }

    @GetMapping("/admin/stats")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "[ADMIN] Statistiques des demandes PREMIUM")
    public ResponseEntity<ApiResponse<Map<String, Long>>> getStats() {
        Map<String, Long> stats = Map.of("pending", premiumRequestService.countPending());
        return ResponseEntity.ok(ApiResponse.success(stats, "Statistiques des demandes PREMIUM"));
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
