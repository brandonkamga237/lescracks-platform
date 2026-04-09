package com.brandonkamga.lescracks.controller;

import com.brandonkamga.lescracks.domain.Contributor;
import com.brandonkamga.lescracks.domain.OpenSourceProject;
import com.brandonkamga.lescracks.dto.ApiResponse;
import com.brandonkamga.lescracks.dto.ContributorRequest;
import com.brandonkamga.lescracks.dto.ContributorResponse;
import com.brandonkamga.lescracks.dto.OpenSourceProjectRequest;
import com.brandonkamga.lescracks.dto.OpenSourceProjectResponse;
import com.brandonkamga.lescracks.exception.ResourceNotFoundException;
import com.brandonkamga.lescracks.repository.ContributorRepository;
import com.brandonkamga.lescracks.repository.OpenSourceProjectRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/open-source")
@Tag(name = "Open Source", description = "Gestion des projets open source et des contributeurs")
@SecurityRequirement(name = "bearerAuth")
public class OpenSourceController {

    private final ContributorRepository contributorRepository;
    private final OpenSourceProjectRepository projectRepository;

    public OpenSourceController(ContributorRepository contributorRepository,
                                 OpenSourceProjectRepository projectRepository) {
        this.contributorRepository = contributorRepository;
        this.projectRepository = projectRepository;
    }

    // ─────────────────────────────────────────────────────────────
    // PUBLIC ENDPOINTS
    // ─────────────────────────────────────────────────────────────

    @GetMapping("/projects")
    @Operation(summary = "Liste tous les projets open source visibles")
    public ResponseEntity<ApiResponse<List<OpenSourceProjectResponse>>> getAllProjects() {
        List<OpenSourceProjectResponse> projects = projectRepository
                .findByVisibleTrueOrderByFeaturedOrderAsc()
                .stream().map(this::toProjectResponse).collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(projects));
    }

    @GetMapping("/projects/featured")
    @Operation(summary = "Liste les projets open source mis en avant (homepage)")
    public ResponseEntity<ApiResponse<List<OpenSourceProjectResponse>>> getFeaturedProjects() {
        List<OpenSourceProjectResponse> projects = projectRepository
                .findByFeaturedTrueAndVisibleTrueOrderByFeaturedOrderAsc()
                .stream().map(this::toProjectResponse).collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(projects));
    }

    @GetMapping("/contributors")
    @Operation(summary = "Liste tous les contributeurs visibles")
    public ResponseEntity<ApiResponse<List<ContributorResponse>>> getAllContributors() {
        List<ContributorResponse> contributors = contributorRepository
                .findByVisibleTrueOrderByDisplayOrderAsc()
                .stream().map(this::toContributorResponse).collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(contributors));
    }

    // ─────────────────────────────────────────────────────────────
    // ADMIN ENDPOINTS — PROJECTS
    // ─────────────────────────────────────────────────────────────

    @GetMapping("/admin/projects")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "[Admin] Liste tous les projets")
    public ResponseEntity<ApiResponse<List<OpenSourceProjectResponse>>> adminGetAllProjects() {
        List<OpenSourceProjectResponse> projects = projectRepository.findAll()
                .stream().map(this::toProjectResponse).collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(projects));
    }

    @PostMapping("/admin/projects")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "[Admin] Créer un projet open source")
    public ResponseEntity<ApiResponse<OpenSourceProjectResponse>> createProject(
            @Valid @RequestBody OpenSourceProjectRequest request) {
        OpenSourceProject project = OpenSourceProject.builder()
                .name(request.getName())
                .description(request.getDescription())
                .repoUrl(request.getRepoUrl())
                .language(request.getLanguage())
                .logoUrl(request.getLogoUrl())
                .techStack(request.getTechStack())
                .stars(request.getStars())
                .forks(request.getForks())
                .featured(request.isFeatured())
                .featuredOrder(request.getFeaturedOrder())
                .visible(request.isVisible())
                .build();
        return ResponseEntity.ok(ApiResponse.success(toProjectResponse(projectRepository.save(project)),
                "Projet créé avec succès"));
    }

    @PutMapping("/admin/projects/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "[Admin] Modifier un projet open source")
    public ResponseEntity<ApiResponse<OpenSourceProjectResponse>> updateProject(
            @PathVariable Long id, @Valid @RequestBody OpenSourceProjectRequest request) {
        OpenSourceProject project = projectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("OpenSourceProject", "id", id));
        project.setName(request.getName());
        project.setDescription(request.getDescription());
        project.setRepoUrl(request.getRepoUrl());
        project.setLanguage(request.getLanguage());
        project.setLogoUrl(request.getLogoUrl());
        project.setTechStack(request.getTechStack());
        project.setStars(request.getStars());
        project.setForks(request.getForks());
        project.setFeatured(request.isFeatured());
        project.setFeaturedOrder(request.getFeaturedOrder());
        project.setVisible(request.isVisible());
        return ResponseEntity.ok(ApiResponse.success(toProjectResponse(projectRepository.save(project)),
                "Projet mis à jour"));
    }

    @DeleteMapping("/admin/projects/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "[Admin] Supprimer un projet open source")
    public ResponseEntity<ApiResponse<Void>> deleteProject(@PathVariable Long id) {
        if (!projectRepository.existsById(id))
            throw new ResourceNotFoundException("OpenSourceProject", "id", id);
        projectRepository.deleteById(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Projet supprimé"));
    }

    // ─────────────────────────────────────────────────────────────
    // ADMIN ENDPOINTS — CONTRIBUTORS
    // ─────────────────────────────────────────────────────────────

    @GetMapping("/admin/contributors")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "[Admin] Liste tous les contributeurs")
    public ResponseEntity<ApiResponse<List<ContributorResponse>>> adminGetAllContributors() {
        List<ContributorResponse> contributors = contributorRepository.findAll()
                .stream().map(this::toContributorResponse).collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(contributors));
    }

    @PostMapping("/admin/contributors")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "[Admin] Créer un profil contributeur")
    public ResponseEntity<ApiResponse<ContributorResponse>> createContributor(
            @Valid @RequestBody ContributorRequest request) {
        Contributor contributor = Contributor.builder()
                .name(request.getName())
                .description(request.getDescription())
                .photoUrl(request.getPhotoUrl())
                .githubUrl(request.getGithubUrl())
                .linkedinUrl(request.getLinkedinUrl())
                .websiteUrl(request.getWebsiteUrl())
                .twitterUrl(request.getTwitterUrl())
                .contributedProjects(request.getContributedProjects())
                .displayOrder(request.getDisplayOrder())
                .visible(request.isVisible())
                .build();
        return ResponseEntity.ok(ApiResponse.success(toContributorResponse(contributorRepository.save(contributor)),
                "Contributeur créé avec succès"));
    }

    @PutMapping("/admin/contributors/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "[Admin] Modifier un profil contributeur")
    public ResponseEntity<ApiResponse<ContributorResponse>> updateContributor(
            @PathVariable Long id, @Valid @RequestBody ContributorRequest request) {
        Contributor contributor = contributorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Contributor", "id", id));
        contributor.setName(request.getName());
        contributor.setDescription(request.getDescription());
        contributor.setPhotoUrl(request.getPhotoUrl());
        contributor.setGithubUrl(request.getGithubUrl());
        contributor.setLinkedinUrl(request.getLinkedinUrl());
        contributor.setWebsiteUrl(request.getWebsiteUrl());
        contributor.setTwitterUrl(request.getTwitterUrl());
        contributor.setContributedProjects(request.getContributedProjects());
        contributor.setDisplayOrder(request.getDisplayOrder());
        contributor.setVisible(request.isVisible());
        return ResponseEntity.ok(ApiResponse.success(toContributorResponse(contributorRepository.save(contributor)),
                "Contributeur mis à jour"));
    }

    @DeleteMapping("/admin/contributors/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "[Admin] Supprimer un contributeur")
    public ResponseEntity<ApiResponse<Void>> deleteContributor(@PathVariable Long id) {
        if (!contributorRepository.existsById(id))
            throw new ResourceNotFoundException("Contributor", "id", id);
        contributorRepository.deleteById(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Contributeur supprimé"));
    }

    // ─────────────────────────────────────────────────────────────
    // MAPPERS
    // ─────────────────────────────────────────────────────────────

    private OpenSourceProjectResponse toProjectResponse(OpenSourceProject p) {
        return OpenSourceProjectResponse.builder()
                .id(p.getId()).name(p.getName()).description(p.getDescription())
                .repoUrl(p.getRepoUrl()).language(p.getLanguage()).logoUrl(p.getLogoUrl())
                .techStack(p.getTechStack()).stars(p.getStars()).forks(p.getForks())
                .featured(p.isFeatured()).featuredOrder(p.getFeaturedOrder()).visible(p.isVisible())
                .build();
    }

    private ContributorResponse toContributorResponse(Contributor c) {
        return ContributorResponse.builder()
                .id(c.getId()).name(c.getName()).description(c.getDescription())
                .photoUrl(c.getPhotoUrl()).githubUrl(c.getGithubUrl()).linkedinUrl(c.getLinkedinUrl())
                .websiteUrl(c.getWebsiteUrl()).twitterUrl(c.getTwitterUrl())
                .contributedProjects(c.getContributedProjects())
                .displayOrder(c.getDisplayOrder()).visible(c.isVisible())
                .build();
    }
}
