package com.brandonkamga.lescracks.controller;

import com.brandonkamga.lescracks.domain.*;
import com.brandonkamga.lescracks.dto.ApiResponse;
import com.brandonkamga.lescracks.repository.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final UserRepository userRepository;
    private final ResourceRepository resourceRepository;
    private final EventRepository eventRepository;
    private final CategoryRepository categoryRepository;
    private final TagRepository tagRepository;
    private final RoleRepository roleRepository;
    private final ApplicationRepository applicationRepository;
    private final PremiumRequestRepository premiumRequestRepository;

    public AdminController(
            UserRepository userRepository,
            ResourceRepository resourceRepository,
            EventRepository eventRepository,
            CategoryRepository categoryRepository,
            TagRepository tagRepository,
            RoleRepository roleRepository,
            ApplicationRepository applicationRepository,
            PremiumRequestRepository premiumRequestRepository) {
        this.userRepository = userRepository;
        this.resourceRepository = resourceRepository;
        this.eventRepository = eventRepository;
        this.categoryRepository = categoryRepository;
        this.tagRepository = tagRepository;
        this.roleRepository = roleRepository;
        this.applicationRepository = applicationRepository;
        this.premiumRequestRepository = premiumRequestRepository;
    }

    // === DASHBOARD ===
    @GetMapping("/dashboard")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getDashboard() {
        Map<String, Object> stats = new HashMap<>();
        
        // Basic counts
        long totalUsers = userRepository.count();
        stats.put("totalUsers", totalUsers);
        stats.put("totalResources", resourceRepository.count());
        stats.put("totalEvents", eventRepository.count());
        stats.put("totalCategories", categoryRepository.count());
        stats.put("totalTags", tagRepository.count());
        
        // Users by role
        long adminCount = userRepository.countByRole_Name(com.brandonkamga.lescracks.domain.RoleName.admin);
        long premiumCount = userRepository.countByRole_Name(com.brandonkamga.lescracks.domain.RoleName.premium_user);
        long learnerCount = userRepository.countByRole_Name(com.brandonkamga.lescracks.domain.RoleName.learner);
        long freeCount = userRepository.countByRole_Name(com.brandonkamga.lescracks.domain.RoleName.user);
        stats.put("usersByRole", Map.of(
            "ADMIN", adminCount,
            "PREMIUM", premiumCount,
            "LEARNER", learnerCount,
            "FREE", freeCount
        ));
        
        // Users by provider
        long localUsers = userRepository.countByProvider_Name(com.brandonkamga.lescracks.domain.ProviderType.LOCAL);
        long googleUsers = userRepository.countByProvider_Name(com.brandonkamga.lescracks.domain.ProviderType.GOOGLE);
        long githubUsers = userRepository.countByProvider_Name(com.brandonkamga.lescracks.domain.ProviderType.GITHUB);
        stats.put("usersByProvider", Map.of(
            "LOCAL", localUsers,
            "GOOGLE", googleUsers,
            "GITHUB", githubUsers
        ));
        
        // Resources by type
        long videoCount = resourceRepository.countByResourceType_Name(com.brandonkamga.lescracks.domain.ResourceTypeName.video);
        long documentCount = resourceRepository.countByResourceType_Name(com.brandonkamga.lescracks.domain.ResourceTypeName.document);
        stats.put("resourcesByType", Map.of(
            "VIDEO", videoCount,
            "DOCUMENT", documentCount
        ));
        
        // Resources by category (top 5)
        List<Object[]> resourcesByCategory = resourceRepository.countByCategoryGrouped();
        List<Map<String, Object>> categoryStats = new ArrayList<>();
        for (Object[] row : resourcesByCategory) {
            Map<String, Object> catStat = new HashMap<>();
            catStat.put("categoryName", ((Category) row[0]).getName());
            catStat.put("count", row[1]);
            categoryStats.add(catStat);
        }
        stats.put("resourcesByCategory", categoryStats);
        
        // Events by status
        long openEvents = eventRepository.countByStatus_Name(com.brandonkamga.lescracks.domain.EventStatusEnum.open);
        long closedEvents = eventRepository.countByStatus_Name(com.brandonkamga.lescracks.domain.EventStatusEnum.closed);
        long upcomingEvents = eventRepository.countByStatus_Name(com.brandonkamga.lescracks.domain.EventStatusEnum.upcoming);
        stats.put("eventsByStatus", Map.of(
            "OUVERT", openEvents,
            "FERME", closedEvents,
            "A_VENIR", upcomingEvents
        ));
        
        // Time windows
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime thirtyDaysAgo = now.minusDays(30);
        LocalDateTime sixtyDaysAgo = now.minusDays(60);

        // Growth — current vs previous period
        long newUsersLast30Days = userRepository.countByCreatedAtAfter(thirtyDaysAgo);
        long newUsersPrev30Days = userRepository.countByCreatedAtAfter(sixtyDaysAgo) - newUsersLast30Days;
        stats.put("newUsersLast30Days", newUsersLast30Days);
        stats.put("newUsersPrev30Days", newUsersPrev30Days);

        long newResourcesLast30Days = resourceRepository.countByCreatedAtAfter(thirtyDaysAgo);
        stats.put("newResourcesLast30Days", newResourcesLast30Days);

        // Premium conversion rate (premium_user + learner + admin) / total * 100
        double premiumRate = (totalUsers > 0)
                ? Math.round(((adminCount + premiumCount + learnerCount) * 100.0) / totalUsers * 10) / 10.0
                : 0.0;
        stats.put("premiumConversionRate", premiumRate);

        // Application funnel
        long appPending = applicationRepository.countByStatus(ApplicationStatus.pending);
        long appAccepted = applicationRepository.countByStatus(ApplicationStatus.accepted);
        long appRejected = applicationRepository.countByStatus(ApplicationStatus.rejected);
        stats.put("applicationsByStatus", Map.of(
                "En attente", appPending,
                "Accepté", appAccepted,
                "Rejeté", appRejected
        ));

        // Premium requests — all requests are pending by definition (no status field anymore)
        long prPending = premiumRequestRepository.count();
        stats.put("premiumRequestsByStatus", Map.of("En attente", prPending));
        stats.put("totalPremiumRequests", prPending);

        // Engagement — total views and downloads across all resources
        List<Resource> allResources = resourceRepository.findAll();
        long totalViews = allResources.stream().mapToLong(Resource::getViewCount).sum();
        long totalDownloads = allResources.stream().mapToLong(Resource::getDownloadCount).sum();
        stats.put("totalViews", totalViews);
        stats.put("totalDownloads", totalDownloads);

        // Top 5 resources by views
        List<Map<String, Object>> topViewed = resourceRepository.findTop5ByOrderByViewCountDesc()
                .stream().map(r -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("id", r.getId());
                    m.put("title", r.getTitle());
                    m.put("viewCount", r.getViewCount());
                    m.put("downloadCount", r.getDownloadCount());
                    m.put("type", r.getResourceType() != null ? r.getResourceType().getName().name().toUpperCase() : "");
                    return m;
                }).toList();
        stats.put("topViewedResources", topViewed);

        // Top 5 resources by downloads
        List<Map<String, Object>> topDownloaded = resourceRepository.findTop5ByOrderByDownloadCountDesc()
                .stream().map(r -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("id", r.getId());
                    m.put("title", r.getTitle());
                    m.put("viewCount", r.getViewCount());
                    m.put("downloadCount", r.getDownloadCount());
                    m.put("type", r.getResourceType() != null ? r.getResourceType().getName().name().toUpperCase() : "");
                    return m;
                }).toList();
        stats.put("topDownloadedResources", topDownloaded);

        // Daily new users — last 7 days (sparkline data)
        List<Map<String, Object>> dailyUsers = new ArrayList<>();
        for (int i = 6; i >= 0; i--) {
            LocalDateTime dayStart = LocalDate.now().minusDays(i).atStartOfDay();
            LocalDateTime dayEnd = dayStart.plusDays(1);
            long count = userRepository.countByCreatedAtAfter(dayStart)
                    - userRepository.countByCreatedAtAfter(dayEnd);
            Map<String, Object> day = new HashMap<>();
            day.put("date", LocalDate.now().minusDays(i).toString());
            day.put("count", Math.max(0, count));
            dailyUsers.add(day);
        }
        stats.put("dailyNewUsers", dailyUsers);

        // Recent users (last 5)
        Pageable recentUsersPage = PageRequest.of(0, 5, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<User> recentUsers = userRepository.findAll(recentUsersPage);
        stats.put("recentUsers", recentUsers.getContent().stream().map(this::mapUserToResponse).toList());

        // Recent resources (last 5)
        Pageable recentResourcesPage = PageRequest.of(0, 5, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Resource> recentResources = resourceRepository.findAll(recentResourcesPage);
        stats.put("recentResources", recentResources.getContent().stream().map(this::mapResourceToResponse).toList());

        return ResponseEntity.ok(ApiResponse.success(stats));
    }

    // === USERS ===
    @GetMapping("/users")
    public ResponseEntity<ApiResponse<Page<Map<String, Object>>>> getUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<User> users = userRepository.findAll(pageable);
        
        Page<Map<String, Object>> response = users.map(user -> mapUserToResponse(user));
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/users/{id}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getUser(@PathVariable Long id) {
        Optional<User> userOpt = userRepository.findById(id);
        if (userOpt.isPresent()) {
            return ResponseEntity.ok(ApiResponse.success(mapUserToResponse(userOpt.get())));
        }
        return ResponseEntity.notFound().build();
    }

    @PutMapping("/users/{id}/role")
    public ResponseEntity<ApiResponse<Map<String, Object>>> updateUserRole(
            @PathVariable Long id,
            @RequestBody Map<String, String> request) {
        String newRole = request.get("roleName");
        if (newRole == null || newRole.isEmpty()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Role name is required"));
        }
        
        Optional<User> userOpt = userRepository.findById(id);
        if (userOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        
        User user = userOpt.get();
        
        // Find the new role
        try {
            RoleName roleName = switch (newRole.toUpperCase()) {
                case "ADMIN" -> RoleName.admin;
                case "PREMIUM", "PREMIUM_USER" -> RoleName.premium_user;
                case "LEARNER" -> RoleName.learner;
                default -> RoleName.user;
            };
            Optional<Role> roleOpt = roleRepository.findByName(roleName);
            if (roleOpt.isEmpty()) {
                return ResponseEntity.badRequest().body(ApiResponse.error("Role not found: " + newRole));
            }
            user.setRole(roleOpt.get());
            userRepository.save(user);
            return ResponseEntity.ok(ApiResponse.success(mapUserToResponse(user), "Role updated successfully"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Invalid role: " + newRole));
        }
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteUser(@PathVariable Long id) {
        Optional<User> userOpt = userRepository.findById(id);
        if (userOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        
        User user = userOpt.get();
        // Prevent deleting admin users
        if (user.getRole() != null && user.getRole().getName() == RoleName.admin) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Cannot delete admin user"));
        }
        
        userRepository.deleteById(id);
        return ResponseEntity.ok(ApiResponse.success(null, "User deleted successfully"));
    }

    // === CATEGORIES ===
    @GetMapping("/categories")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getCategories() {
        List<Category> categories = categoryRepository.findAll();
        List<Map<String, Object>> response = categories.stream()
                .map(category -> mapCategoryToResponse(category))
                .toList();
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/categories")
    public ResponseEntity<ApiResponse<Map<String, Object>>> createCategory(@RequestBody Map<String, String> request) {
        Category category = Category.builder()
                .name(request.get("name"))
                .build();
        Category saved = categoryRepository.save(category);
        return ResponseEntity.ok(ApiResponse.success(mapCategoryToResponse(saved), "Category created"));
    }

    @PutMapping("/categories/{id}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> updateCategory(
            @PathVariable Long id,
            @RequestBody Map<String, String> request) {
        Optional<Category> catOpt = categoryRepository.findById(id);
        if (catOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        Category category = catOpt.get();
        category.setName(request.get("name"));
        Category saved = categoryRepository.save(category);
        return ResponseEntity.ok(ApiResponse.success(mapCategoryToResponse(saved), "Category updated"));
    }

    @DeleteMapping("/categories/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteCategory(@PathVariable Long id) {
        categoryRepository.deleteById(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Category deleted"));
    }

    // === TAGS ===
    @GetMapping("/tags")
    public ResponseEntity<ApiResponse<Page<Map<String, Object>>>> getTags(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.ASC, "name"));
        Page<Tag> tags = tagRepository.findAll(pageable);
        
        Page<Map<String, Object>> response = tags.map(tag -> mapTagToResponse(tag));
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/tags")
    public ResponseEntity<ApiResponse<Map<String, Object>>> createTag(@RequestBody Map<String, Object> request) {
        Long categoryId = Long.parseLong(request.get("categoryId").toString());
        Optional<Category> catOpt = categoryRepository.findById(categoryId);
        if (catOpt.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        
        Tag tag = Tag.builder()
                .name(request.get("name").toString())
                .category(catOpt.get())
                .build();
        Tag saved = tagRepository.save(tag);
        return ResponseEntity.ok(ApiResponse.success(mapTagToResponse(saved), "Tag created"));
    }

    @PutMapping("/tags/{id}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> updateTag(
            @PathVariable Long id,
            @RequestBody Map<String, Object> request) {
        Optional<Tag> tagOpt = tagRepository.findById(id);
        if (tagOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        
        Tag tag = tagOpt.get();
        tag.setName(request.get("name").toString());
        
        if (request.get("categoryId") != null) {
            Long categoryId = Long.parseLong(request.get("categoryId").toString());
            Optional<Category> catOpt = categoryRepository.findById(categoryId);
            catOpt.ifPresent(tag::setCategory);
        }
        
        Tag saved = tagRepository.save(tag);
        return ResponseEntity.ok(ApiResponse.success(mapTagToResponse(saved), "Tag updated"));
    }

    @DeleteMapping("/tags/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteTag(@PathVariable Long id) {
        tagRepository.deleteById(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Tag deleted"));
    }

    // === RESOURCES ===
    @GetMapping("/resources")
    public ResponseEntity<ApiResponse<Page<Map<String, Object>>>> getResources(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Resource> resources = resourceRepository.findAll(pageable);
        
        Page<Map<String, Object>> response = resources.map(resource -> mapResourceToResponse(resource));
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @DeleteMapping("/resources/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteResource(@PathVariable Long id) {
        resourceRepository.deleteById(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Resource deleted"));
    }

    // === EVENTS ===
    @GetMapping("/events")
    public ResponseEntity<ApiResponse<Page<Map<String, Object>>>> getEvents(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "eventDate"));
        Page<Event> events = eventRepository.findAll(pageable);
        
        Page<Map<String, Object>> response = events.map(event -> mapEventToResponse(event));
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @DeleteMapping("/events/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteEvent(@PathVariable Long id) {
        eventRepository.deleteById(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Event deleted"));
    }

    // === MAPPING HELPERS ===
    private Map<String, Object> mapUserToResponse(User user) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", user.getId());
        map.put("email", user.getEmail());
        map.put("username", user.getUsername());
        map.put("roleName", user.getRole() != null ? user.getRole().getName().name().toUpperCase() : "USER");
        map.put("providerName", user.getProvider() != null ? user.getProvider().getProviderName().name() : "LOCAL");
        map.put("createdAt", user.getCreatedAt() != null ? user.getCreatedAt().toString() : "");
        map.put("enabled", true);
        return map;
    }

    private Map<String, Object> mapCategoryToResponse(Category category) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", category.getId());
        map.put("name", category.getName());
        return map;
    }

    private Map<String, Object> mapTagToResponse(Tag tag) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", tag.getId());
        map.put("name", tag.getName());
        if (tag.getCategory() != null) {
            map.put("categoryId", tag.getCategory().getId());
            map.put("categoryName", tag.getCategory().getName());
        } else {
            map.put("categoryId", null);
            map.put("categoryName", null);
        }
        return map;
    }

    private Map<String, Object> mapResourceToResponse(Resource resource) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", resource.getId());
        map.put("title", resource.getTitle());
        map.put("description", resource.getDescription());
        map.put("url", resource.getUrl());
        map.put("createdAt", resource.getCreatedAt() != null ? resource.getCreatedAt().toString() : "");
        if (resource.getCategory() != null) {
            map.put("categoryId", resource.getCategory().getId());
            map.put("categoryName", resource.getCategory().getName());
        } else {
            map.put("categoryId", null);
            map.put("categoryName", null);
        }
        if (resource.getResourceType() != null) {
            map.put("resourceTypeId", resource.getResourceType().getId());
            map.put("resourceTypeName", resource.getResourceType().getName().name());
        } else {
            map.put("resourceTypeId", null);
            map.put("resourceTypeName", null);
        }
        return map;
    }

    private Map<String, Object> mapEventToResponse(Event event) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", event.getId());
        map.put("title", event.getTitle());
        map.put("description", event.getDescription());
        map.put("startDate", event.getEventDate() != null ? event.getEventDate().toString() : null);
        map.put("endDate", event.getEndDate() != null ? event.getEndDate().toString() : null);
        map.put("location", event.getLocation());
        map.put("coverImageUrl", event.getCoverImageUrl());
        map.put("type", event.getEventType() != null ? event.getEventType().getName() : null);
        map.put("status", event.getEventStatus() != null ? event.getEventStatus().getName().name() : null);
        return map;
    }
}
