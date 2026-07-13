package com.brandonkamga.lescracks.controller;

import com.brandonkamga.lescracks.domain.Learner;
import com.brandonkamga.lescracks.domain.LearnerProject;
import com.brandonkamga.lescracks.domain.LearnerStatus;
import com.brandonkamga.lescracks.domain.RoleName;
import com.brandonkamga.lescracks.domain.User;
import com.brandonkamga.lescracks.dto.ApiResponse;
import com.brandonkamga.lescracks.dto.LearnerProjectResponse;
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
@Tag(name = "Learners", description = "Learner management and public showcase")
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
    @Operation(summary = "List visible learners (optional filter by status)")
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
    @Operation(summary = "List featured learners (landing page)")
    public ResponseEntity<ApiResponse<List<LearnerResponse>>> getShowcasedLearners() {
        List<LearnerResponse> result = learnerRepository
                .findByShowcasedTrueAndVisibleTrueOrderByDisplayOrderAsc()
                .stream().map(this::toResponse).collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/{slug}")
    @Operation(summary = "Public learner profile by slug")
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
    @Operation(summary = "My learner profile")
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
    @Operation(summary = "Update my learner profile (bio, LinkedIn, portfolio)")
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
                toResponse(learnerRepository.save(learner)), "Profile updated"));
    }

    // ─────────────────────────────────────────────────────────────
    // ADMIN ENDPOINTS
    // ─────────────────────────────────────────────────────────────

    @GetMapping("/admin/all")
    @PreAuthorize("hasRole('ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "[Admin] List all learners (including hidden)")
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
    @Operation(summary = "[Admin] Assign the learner role to an existing user",
               description = "Grants the learner role to the user and automatically creates their linked learner profile.")
    public ResponseEntity<ApiResponse<LearnerResponse>> assignLearnerToUser(
            @PathVariable Long userId,
            @RequestBody(required = false) LearnerAssignRequest request) {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        if (learnerRepository.existsByUserId(userId)) {
            throw new BadRequestException("This user already has a learner profile");
        }

        // Assign role
        var learnerRole = roleRepository.findByName(RoleName.learner)
                .orElseThrow(() -> new RuntimeException("LEARNER role not found in database"));
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
                toResponse(learnerRepository.save(learner)), "Learner role assigned and profile created"));
    }

    @PostMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "[Admin] Create a learner manually (without linked account)")
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
                .startedAt(request.getStartedAt())
                .completedAt(request.getCompletedAt())
                .testimonial(request.getTestimonial())
                .githubUrl(request.getGithubUrl())
                .build();
        replaceProjects(learner, request);
        return ResponseEntity.ok(ApiResponse.success(toResponse(learnerRepository.save(learner)), "Learner created"));
    }

    @PutMapping("/admin/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Transactional
    @Operation(summary = "[Admin] Update a learner (curation: showcase, visible, status, cohort...)")
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

        // Evidence
        learner.setStartedAt(request.getStartedAt());
        learner.setCompletedAt(request.getCompletedAt());
        learner.setTestimonial(request.getTestimonial());
        learner.setGithubUrl(request.getGithubUrl());
        replaceProjects(learner, request);

        return ResponseEntity.ok(ApiResponse.success(toResponse(learnerRepository.save(learner)), "Learner updated"));
    }

    @DeleteMapping("/admin/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Transactional
    @Operation(summary = "[Admin] Delete a learner")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        Learner learner = learnerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Learner", "id", id));

        // If linked to a user, downgrade them back to regular user
        if (learner.getUser() != null) {
            User user = learner.getUser();
            var userRole = roleRepository.findByName(RoleName.user)
                    .orElseThrow(() -> new RuntimeException("USER role not found in database"));
            user.setRole(userRole);
            userRepository.save(user);
        }

        learnerRepository.deleteById(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Learner deleted"));
    }

    // ─────────────────────────────────────────────────────────────
    // HELPERS
    // ─────────────────────────────────────────────────────────────

    /**
     * Replace the learner's shipped work with what the admin submitted.
     *
     * The collection is orphanRemoval, so clearing it deletes the rows that were
     * dropped. Projects with neither a repo nor a live URL are rejected: they would
     * appear on the public profile as an unverifiable claim, which is exactly what
     * this model exists to prevent.
     */
    private void replaceProjects(Learner learner, LearnerRequest request) {
        learner.getProjects().clear();
        if (request.getProjects() == null) return;

        for (LearnerRequest.LearnerProjectRequest p : request.getProjects()) {
            if (p == null || p.getTitle() == null || p.getTitle().isBlank()) continue;

            boolean hasLink = (p.getRepoUrl() != null && !p.getRepoUrl().isBlank())
                           || (p.getLiveUrl() != null && !p.getLiveUrl().isBlank());
            if (!hasLink) {
                throw new BadRequestException(
                        "Le projet « " + p.getTitle() + " » n'a ni lien de code ni lien en ligne. "
                      + "Un projet que personne ne peut ouvrir ne prouve rien.");
            }

            learner.getProjects().add(LearnerProject.builder()
                    .learner(learner)
                    .title(p.getTitle())
                    .description(p.getDescription())
                    .repoUrl(p.getRepoUrl())
                    .liveUrl(p.getLiveUrl())
                    .imageUrl(p.getImageUrl())
                    .displayOrder(p.getDisplayOrder())
                    .createdAt(LocalDateTime.now())
                    .build());
        }
    }

    private LearnerProjectResponse toProjectResponse(LearnerProject p) {
        return LearnerProjectResponse.builder()
                .id(p.getId())
                .title(p.getTitle())
                .description(p.getDescription())
                .repoUrl(p.getRepoUrl())
                .liveUrl(p.getLiveUrl())
                .imageUrl(p.getImageUrl())
                .displayOrder(p.getDisplayOrder())
                .verifiable(p.isVerifiable())
                .build();
    }

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
                // Evidence
                .startedAt(l.getStartedAt())
                .completedAt(l.getCompletedAt())
                .durationMonths(l.durationInMonths().orElse(null))
                .testimonial(l.getTestimonial())
                .githubUrl(l.getGithubUrl())
                .projects(l.getProjects().stream()
                        .map(this::toProjectResponse)
                        .collect(Collectors.toList()))
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
