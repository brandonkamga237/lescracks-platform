package com.brandonkamga.lescracks.controller;

import com.brandonkamga.lescracks.domain.User;
import com.brandonkamga.lescracks.dto.admin.UserAdminResponse;
import com.brandonkamga.lescracks.dto.admin.UserStatusRequest;
import com.brandonkamga.lescracks.dto.common.PageResponse;
import com.brandonkamga.lescracks.service.interfaces.AdminUserService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;

import java.nio.charset.StandardCharsets;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;

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

    @GetMapping(value = "/export", produces = "text/csv")
    public ResponseEntity<StreamingResponseBody> export() {
        List<User> list = users.list(null, Pageable.unpaged()).getContent();
        StreamingResponseBody body = out -> {
            out.write("id;email;firstName;lastName;status;provider;verified;createdAt\n".getBytes(StandardCharsets.UTF_8));
            for (User user : list) {
                String row = csvLine(user.getId(), user.getEmail(), user.getFirstName(), user.getLastName(),
                        user.getStatus(), user.getProvider(), user.isEmailVerified(),
                        user.getCreatedAt() == null ? "" : formatter.format(user.getCreatedAt()));
                out.write((row + "\n").getBytes(StandardCharsets.UTF_8));
            }
        };
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=lescracks-users.csv")
                .body(body);
    }

    private UserAdminResponse response(User user) {
        return new UserAdminResponse(user.getId(), user.getEmail(), user.getFirstName(),
                user.getLastName(), user.getStatus(), user.isEmailVerified(), user.getProvider(), user.getCreatedAt());
    }

    private static final DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")
            .withZone(ZoneId.of("UTC"));

    private String csvLine(Object... values) {
        StringBuilder line = new StringBuilder();
        for (int i = 0; i < values.length; i++) {
            if (i > 0) line.append(';');
            String value = String.valueOf(values[i]);
            if (value.contains(";") || value.contains("\"") || value.contains("\n")) {
                line.append('"').append(value.replace("\"", "\"\"")).append('"');
            } else {
                line.append(value);
            }
        }
        return line.toString();
    }
}