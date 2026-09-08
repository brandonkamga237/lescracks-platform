package com.brandonkamga.lescracks.controller;

import com.brandonkamga.lescracks.domain.Admin;
import com.brandonkamga.lescracks.dto.admin.AdminCreateRequest;
import com.brandonkamga.lescracks.dto.admin.AdminResponse;
import com.brandonkamga.lescracks.service.interfaces.AdminManagementService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/admins")
@PreAuthorize("hasRole('ADMIN')")
public class AdminManagementController {
    private final AdminManagementService service;

    public AdminManagementController(AdminManagementService service) { this.service = service; }

    @GetMapping
    public List<AdminResponse> list() {
        return service.list().stream()
                .map(admin -> new AdminResponse(admin.getId(), admin.getUsername(), "ADMIN"))
                .toList();
    }

    @PostMapping
    public ResponseEntity<AdminResponse> create(@Valid @RequestBody AdminCreateRequest request) {
        Admin admin = service.create(request.username(), request.password());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new AdminResponse(admin.getId(), admin.getUsername(), "ADMIN"));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) { service.delete(id); }
}
