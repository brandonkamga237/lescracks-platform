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

    public AdminController(
            UserRepository userRepository,
            ResourceRepository resourceRepository,
            EventRepository eventRepository,
            CategoryRepository categoryRepository,
            TagRepository tagRepository,
            RoleRepository roleRepository) {
        this.userRepository = userRepository;
        this.resourceRepository = resourceRepository;
        this.eventRepository = eventRepository;
        this.categoryRepository = categoryRepository;
        this.tagRepository = tagRepository;
        this.roleRepository = roleRepository;
    }

    // === DASHBOARD ===
    @GetMapping("/dashboard")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getDashboard() {
        Map<String, Object> stats = new HashMap<>();
        
        // Basic counts
        stats.put("totalUsers", userRepository.count());
        stats.put("totalResources", resourceRepository.count());
        stats.put("totalEvents", eventRepository.count());
        stats.put("totalCategories", categoryRepository.count());
        stats.put("totalTags", tagRepository.count());
        
        // Users by role
        long adminCount = userRepository.countByRole_Name(com.brandonkamga.lescracks.domain.RoleName.admin);
        long premiumCount = userRepository.countByRole_Name(com.brandonkamga.lescracks.domain.RoleName.premium_user);
        long freeCount = userRepository.countByRole_Name(com.brandonkamga.lescracks.domain.RoleName.user);
        stats.put("usersByRole", Map.of(
            "ADMIN", adminCount,
            "PREMIUM", premiumCount,
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
        
        // Active users (created in last 30 days)
        LocalDateTime thirtyDaysAgo = LocalDateTime.now().minusDays(30);
        long newUsersLast30Days = userRepository.countByCreatedAtAfter(thirtyDaysAgo);
        stats.put("newUsersLast30Days", newUsersLast30Days);
        
        // Active resources (created in last 30 days)
        long newResourcesLast30Days = resourceRepository.countByCreatedAtAfter(thirtyDaysAgo);
        stats.put("newResourcesLast30Days", newResourcesLast30Days);
        
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
        map.put("startDate", event.getEventDate() != null ? event.getEventDate().toString() : "");
        map.put("endDate", event.getEventDate() != null ? event.getEventDate().toString() : "");
        if (event.getEventType() != null) {
            map.put("type", event.getEventType().getName());
        }
        if (event.getEventStatus() != null) {
            map.put("status", event.getEventStatus().getName().name());
        }
        return map;
    }
}
