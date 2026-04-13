package com.brandonkamga.lescracks.controller;

import com.brandonkamga.lescracks.domain.Learner;
import com.brandonkamga.lescracks.domain.LearnerStatus;
import com.brandonkamga.lescracks.domain.RoleName;
import com.brandonkamga.lescracks.domain.User;
import com.brandonkamga.lescracks.dto.ApiResponse;
import com.brandonkamga.lescracks.dto.LearnerRequest;
import com.brandonkamga.lescracks.dto.LearnerResponse;
import com.brandonkamga.lescracks.dto.LearnerSelfUpdateRequest;
import com.brandonkamga.lescracks.exception.BadRequestException;
import com.brandonkamga.lescracks.exception.ResourceNotFoundException;
import com.brandonkamga.lescracks.repository.LearnerRepository;
import com.brandonkamga.lescracks.repository.RoleRepository;
import com.brandonkamga.lescracks.repository.UserRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
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
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;

    public LearnerController(LearnerRepository learnerRepository,
                             UserRepository userRepository,
                             RoleRepository roleRepository) {
        this.learnerRepository = learnerRepository;
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
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
        return ResponseEntity.ok(ApiResponse.success(
                learners.stream().map(this::toResponse).collect(Collectors.toList())));
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
    // AUTHENTICATED USER — self-edit their learner profile
    // ─────────────────────────────────────────────────────────────

    @GetMapping("/me")
    @PreAuthorize("hasRole('learner')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Mon profil apprenant")
    public ResponseEntity<ApiResponse<LearnerResponse>> getMyProfile(Authentication authentication) {
        User user = resolveUser(authentication);
        Learner learner = learnerRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("LearnerProfile", "userId", user.getId()));
        return ResponseEntity.ok(ApiResponse.success(toResponse(learner)));
    }

    @PutMapping("/me")
    @PreAuthorize("hasRole('learner')")
    @SecurityRequirement(name = "bearerAuth")
    @Transactional
    @Operation(summary = "Mettre à jour mon profil apprenant (bio, LinkedIn, portfolio)")
    public ResponseEntity<ApiResponse<LearnerResponse>> updateMyProfile(
            @RequestBody LearnerSelfUpdateRequest request,
            Authentication authentication) {
        User user = resolveUser(authentication);
        Learner learner = learnerRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("LearnerProfile", "userId", user.getId()));

        if (request.getBio() != null) learner.setBio(request.getBio());
        if (request.getLinkedinUrl() != null) learner.setLinkedinUrl(request.getLinkedinUrl());
        if (request.getPortfolioUrl() != null) learner.setPortfolioUrl(request.getPortfolioUrl());

        return ResponseEntity.ok(ApiResponse.success(
                toResponse(learnerRepository.save(learner)), "Profil mis à jour"));
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

    /**
     * Assign the learner role to an existing user account and create their learner profile.
     * This is the main entry point for the new learner workflow.
     */
    @PostMapping("/admin/assign/{userId}")
    @PreAuthorize("hasRole('ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Transactional
    @Operation(summary = "[Admin] Attribuer le rôle apprenant à un utilisateur existant",
               description = "Donne le rôle learner à l'utilisateur et crée automatiquement son profil apprenant lié.")
    public ResponseEntity<ApiResponse<LearnerResponse>> assignLearnerToUser(
            @PathVariable Long userId,
            @RequestBody(required = false) LearnerAssignRequest request) {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        if (learnerRepository.existsByUserId(userId)) {
            throw new BadRequestException("Cet utilisateur a déjà un profil apprenant");
        }

        // Assign role
        var learnerRole = roleRepository.findByName(RoleName.learner)
                .orElseThrow(() -> new RuntimeException("Rôle LEARNER introuvable en base"));
        user.setRole(learnerRole);
        userRepository.save(user);

        // Create linked learner profile
        String firstName = user.getUsername().contains(" ")
                ? user.getUsername().split(" ")[0]
                : user.getUsername();
        String lastName = user.getUsername().contains(" ")
                ? user.getUsername().substring(user.getUsername().indexOf(" ") + 1)
                : "";

        String cohort = (request != null && request.getCohort() != null) ? request.getCohort() : null;

        Learner learner = Learner.builder()
                .user(user)
                .firstName(firstName)
                .lastName(lastName)
                .slug(generateUniqueSlug(firstName, lastName))
                .email(user.getEmail())
                .cohort(cohort)
                .status(LearnerStatus.EN_COURS)
                .showcased(false)
                .visible(true)
                .displayOrder(0)
                .createdAt(LocalDateTime.now())
                .build();

        return ResponseEntity.ok(ApiResponse.success(
                toResponse(learnerRepository.save(learner)), "Rôle apprenant attribué et profil créé"));
    }

    @PostMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "[Admin] Créer un apprenant manuellement (sans compte lié)")
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
    @Transactional
    @Operation(summary = "[Admin] Modifier un apprenant (curation : showcase, visible, status, cohort...)")
    public ResponseEntity<ApiResponse<LearnerResponse>> update(
            @PathVariable Long id, @Valid @RequestBody LearnerRequest request) {
        Learner learner = learnerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Learner", "id", id));

        // Only update name + slug if the learner has no linked account (manual profiles)
        if (learner.getUser() == null) {
            if (!learner.getFirstName().equals(request.getFirstName())
                    || !learner.getLastName().equals(request.getLastName())) {
                learner.setSlug(generateUniqueSlugExcluding(request.getFirstName(), request.getLastName(), id));
            }
            learner.setFirstName(request.getFirstName());
            learner.setLastName(request.getLastName());
            learner.setPhotoUrl(request.getPhotoUrl());
            learner.setEmail(request.getEmail());
        }

        // Fields admin can always edit
        learner.setBio(request.getBio());
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
    @Transactional
    @Operation(summary = "[Admin] Supprimer un apprenant")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        Learner learner = learnerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Learner", "id", id));

        // If linked to a user, downgrade them back to regular user
        if (learner.getUser() != null) {
            User user = learner.getUser();
            var userRole = roleRepository.findByName(RoleName.user)
                    .orElseThrow(() -> new RuntimeException("Rôle USER introuvable en base"));
            user.setRole(userRole);
            userRepository.save(user);
        }

        learnerRepository.deleteById(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Apprenant supprimé"));
    }

    // ─────────────────────────────────────────────────────────────
    // HELPERS
    // ─────────────────────────────────────────────────────────────

    private LearnerResponse toResponse(Learner l) {
        // For linked accounts: derive photo from user.pictureUrl if no explicit photoUrl
        String photo = l.getPhotoUrl();
        if (photo == null && l.getUser() != null) {
            photo = l.getUser().getPictureUrl();
        }
        // For linked accounts: use user's actual name if set
        String firstName = l.getFirstName();
        String lastName = l.getLastName();

        return LearnerResponse.builder()
                .id(l.getId())
                .userId(l.getUser() != null ? l.getUser().getId() : null)
                .firstName(firstName)
                .lastName(lastName)
                .fullName(firstName + (lastName != null && !lastName.isBlank() ? " " + lastName : ""))
                .slug(l.getSlug())
                .bio(l.getBio())
                .photoUrl(photo)
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

    private User resolveUser(Authentication authentication) {
        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", authentication.getName()));
    }

    private LearnerStatus parseStatus(String s) {
        if (s == null || s.isBlank()) return LearnerStatus.EN_COURS;
        try {
            return LearnerStatus.valueOf(s.toUpperCase());
        } catch (IllegalArgumentException e) {
            return LearnerStatus.EN_COURS;
        }
    }

    private String generateUniqueSlug(String firstName, String lastName) {
        String base = toSlug(firstName + (lastName != null && !lastName.isBlank() ? "-" + lastName : ""));
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

    /** Simple inline DTO for the assign endpoint */
    public static class LearnerAssignRequest {
        private String cohort;
        public String getCohort() { return cohort; }
        public void setCohort(String cohort) { this.cohort = cohort; }
    }
}
