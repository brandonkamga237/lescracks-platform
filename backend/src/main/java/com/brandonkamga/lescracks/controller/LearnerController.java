package com.brandonkamga.lescracks.controller;

import com.brandonkamga.lescracks.domain.Learner;
import com.brandonkamga.lescracks.domain.LearnerStatus;
import com.brandonkamga.lescracks.dto.ApiResponse;
import com.brandonkamga.lescracks.dto.LearnerRequest;
import com.brandonkamga.lescracks.dto.LearnerResponse;
import com.brandonkamga.lescracks.exception.ResourceNotFoundException;
import com.brandonkamga.lescracks.repository.LearnerRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.text.Normalizer;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/learners")
@Tag(name = "Apprenants", description = "Gestion des apprenants et de leur vitrine publique")
public class LearnerController {

    private final LearnerRepository learnerRepository;

    public LearnerController(LearnerRepository learnerRepository) {
        this.learnerRepository = learnerRepository;
    }

    // ─────────────────────────────────────────────────────────────
    // PUBLIC ENDPOINTS
    // ─────────────────────────────────────────────────────────────

    @GetMapping
    @Operation(summary = "Liste les apprenants visibles (filtre optionnel par status)")
    public ResponseEntity<ApiResponse<List<LearnerResponse>>> getVisibleLearners(
            @RequestParam(required = false) String status) {
        List<Learner> learners;
        if (status != null && !status.isBlank()) {
            LearnerStatus s = LearnerStatus.valueOf(status.toUpperCase());
            learners = learnerRepository.findByVisibleTrueAndStatusOrderByDisplayOrderAsc(s);
        } else {
            learners = learnerRepository.findByVisibleTrueOrderByDisplayOrderAsc();
        }
        return ResponseEntity.ok(ApiResponse.success(learners.stream().map(this::toResponse).collect(Collectors.toList())));
    }

    @GetMapping("/showcased")
    @Operation(summary = "Liste les apprenants mis en avant (landing page)")
    public ResponseEntity<ApiResponse<List<LearnerResponse>>> getShowcasedLearners() {
        List<LearnerResponse> result = learnerRepository
                .findByShowcasedTrueAndVisibleTrueOrderByDisplayOrderAsc()
                .stream().map(this::toResponse).collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/{slug}")
    @Operation(summary = "Profil public d'un apprenant via son slug")
    public ResponseEntity<ApiResponse<LearnerResponse>> getLearnerBySlug(@PathVariable String slug) {
        Learner learner = learnerRepository.findBySlug(slug)
                .filter(Learner::isVisible)
                .orElseThrow(() -> new ResourceNotFoundException("Learner", "slug", slug));
        return ResponseEntity.ok(ApiResponse.success(toResponse(learner)));
    }

    // ─────────────────────────────────────────────────────────────
    // ADMIN ENDPOINTS
    // ─────────────────────────────────────────────────────────────

    @GetMapping("/admin/all")
    @PreAuthorize("hasRole('ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "[Admin] Liste tous les apprenants (incluant non visibles)")
    public ResponseEntity<ApiResponse<List<LearnerResponse>>> adminGetAll() {
        List<LearnerResponse> result = learnerRepository.findAll()
                .stream().map(this::toResponse).collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @PostMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "[Admin] Créer un apprenant")
    public ResponseEntity<ApiResponse<LearnerResponse>> create(@Valid @RequestBody LearnerRequest request) {
        String slug = generateUniqueSlug(request.getFirstName(), request.getLastName());
        Learner learner = Learner.builder()
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .slug(slug)
                .bio(request.getBio())
                .photoUrl(request.getPhotoUrl())
                .email(request.getEmail())
                .linkedinUrl(request.getLinkedinUrl())
                .portfolioUrl(request.getPortfolioUrl())
                .status(parseStatus(request.getStatus()))
                .cohort(request.getCohort())
                .showcased(request.isShowcased())
                .visible(request.isVisible())
                .displayOrder(request.getDisplayOrder())
                .createdAt(LocalDateTime.now())
                .build();
        return ResponseEntity.ok(ApiResponse.success(toResponse(learnerRepository.save(learner)), "Apprenant créé"));
    }

    @PutMapping("/admin/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "[Admin] Modifier un apprenant")
    public ResponseEntity<ApiResponse<LearnerResponse>> update(
            @PathVariable Long id, @Valid @RequestBody LearnerRequest request) {
        Learner learner = learnerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Learner", "id", id));

        // Re-générer le slug seulement si le nom change
        if (!learner.getFirstName().equals(request.getFirstName())
                || !learner.getLastName().equals(request.getLastName())) {
            learner.setSlug(generateUniqueSlugExcluding(request.getFirstName(), request.getLastName(), id));
        }

        learner.setFirstName(request.getFirstName());
        learner.setLastName(request.getLastName());
        learner.setBio(request.getBio());
        learner.setPhotoUrl(request.getPhotoUrl());
        learner.setEmail(request.getEmail());
        learner.setLinkedinUrl(request.getLinkedinUrl());
        learner.setPortfolioUrl(request.getPortfolioUrl());
        learner.setStatus(parseStatus(request.getStatus()));
        learner.setCohort(request.getCohort());
        learner.setShowcased(request.isShowcased());
        learner.setVisible(request.isVisible());
        learner.setDisplayOrder(request.getDisplayOrder());

        return ResponseEntity.ok(ApiResponse.success(toResponse(learnerRepository.save(learner)), "Apprenant mis à jour"));
    }

    @DeleteMapping("/admin/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "[Admin] Supprimer un apprenant")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        if (!learnerRepository.existsById(id))
            throw new ResourceNotFoundException("Learner", "id", id);
        learnerRepository.deleteById(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Apprenant supprimé"));
    }

    // ─────────────────────────────────────────────────────────────
    // HELPERS
    // ─────────────────────────────────────────────────────────────

    private LearnerResponse toResponse(Learner l) {
        return LearnerResponse.builder()
                .id(l.getId())
                .firstName(l.getFirstName())
                .lastName(l.getLastName())
                .fullName(l.getFirstName() + " " + l.getLastName())
                .slug(l.getSlug())
                .bio(l.getBio())
                .photoUrl(l.getPhotoUrl())
                .email(l.getEmail())
                .linkedinUrl(l.getLinkedinUrl())
                .portfolioUrl(l.getPortfolioUrl())
                .status(l.getStatus().name())
                .cohort(l.getCohort())
                .showcased(l.isShowcased())
                .visible(l.isVisible())
                .displayOrder(l.getDisplayOrder())
                .createdAt(l.getCreatedAt())
                .build();
    }

    private LearnerStatus parseStatus(String s) {
        if (s == null || s.isBlank()) return LearnerStatus.EN_COURS;
        try {
            return LearnerStatus.valueOf(s.toUpperCase());
        } catch (IllegalArgumentException e) {
            return LearnerStatus.EN_COURS;
        }
    }

    /** Génère un slug unique à partir du prénom+nom (ex: brandon-kamga) */
    private String generateUniqueSlug(String firstName, String lastName) {
        String base = toSlug(firstName + "-" + lastName);
        String slug = base;
        int counter = 2;
        while (learnerRepository.existsBySlug(slug)) {
            slug = base + "-" + counter++;
        }
        return slug;
    }

    private String generateUniqueSlugExcluding(String firstName, String lastName, Long excludeId) {
        String base = toSlug(firstName + "-" + lastName);
        String slug = base;
        int counter = 2;
        while (learnerRepository.existsBySlug(slug)
                && learnerRepository.findBySlug(slug).map(l -> !l.getId().equals(excludeId)).orElse(false)) {
            slug = base + "-" + counter++;
        }
        return slug;
    }

    private static String toSlug(String input) {
        String normalized = Normalizer.normalize(input, Normalizer.Form.NFD)
                .replaceAll("\\p{InCombiningDiacriticalMarks}+", "");
        return normalized.toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9\\-]", "-")
                .replaceAll("-{2,}", "-")
                .replaceAll("^-|-$", "");
    }
}
