package com.brandonkamga.lescracks.controller;

import com.brandonkamga.lescracks.domain.User;
import com.brandonkamga.lescracks.dto.admin.UserAdminResponse;
import com.brandonkamga.lescracks.dto.admin.UserStatusRequest;
import com.brandonkamga.lescracks.dto.common.PageResponse;
import com.brandonkamga.lescracks.service.interfaces.AdminUserService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/users")
@PreAuthorize("hasRole('ADMIN')")
public class AdminUserController {
    private final AdminUserService users;

    public AdminUserController(AdminUserService users) { this.users = users; }

    @GetMapping
    public PageResponse<UserAdminResponse> list(@RequestParam(required = false) String search,
                                                @PageableDefault(size = 20) Pageable pageable) {
        return PageResponse.of(users.list(search, pageable), this::response);
    }

    @GetMapping("/{id}")
    public UserAdminResponse get(@PathVariable Long id) { return response(users.require(id)); }

    @PatchMapping("/{id}/status")
    public UserAdminResponse status(@PathVariable Long id, @Valid @RequestBody UserStatusRequest request) {
        return response(users.setStatus(id, request.status()));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) { users.delete(id); }

    private UserAdminResponse response(User user) {
        return new UserAdminResponse(user.getId(), user.getEmail(), user.getFirstName(),
                user.getLastName(), user.getStatus(), user.getCreatedAt());
    }
}