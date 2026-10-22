package com.brandonkamga.lescracks.identity.api;

import com.brandonkamga.lescracks.identity.api.dto.UserAdminResponse;
import com.brandonkamga.lescracks.identity.api.dto.UserStatusRequest;
import com.brandonkamga.lescracks.identity.domain.admin.AdminUserService;
import com.brandonkamga.lescracks.identity.domain.member.ProfileCompletion;
import com.brandonkamga.lescracks.identity.domain.member.User;
import com.brandonkamga.lescracks.identity.domain.member.UserSearch;
import com.brandonkamga.lescracks.shared.dto.PageResponse;
import com.brandonkamga.lescracks.shared.paging.PageQuery;

import jakarta.validation.Valid;
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
    private static final int MAX_PAGE_SIZE = 100;

    private final AdminUserService users;

    public AdminUserController(AdminUserService users) { this.users = users; }

    /** Newest first. {@code kind}: MEMBER (can sign in) or CONTACT (newsletter only); {@code verified}: email confirmed or not. */
    @GetMapping
    public PageResponse<UserAdminResponse> list(@RequestParam(required = false) String search,
                                                @RequestParam(required = false) UserSearch.Kind kind,
                                                @RequestParam(required = false) Boolean verified,
                                                @RequestParam(defaultValue = "0") int page,
                                                @RequestParam(defaultValue = "20") int size) {
        PageQuery query = new PageQuery(Math.max(0, page), Math.clamp(size, 1, MAX_PAGE_SIZE));
        return PageResponse.of(users.list(new UserSearch(search, kind, verified), query), this::response);
    }

    @GetMapping("/{id}")
    public UserAdminResponse get(@PathVariable Long id) { return response(users.require(id)); }

    @PatchMapping("/{id}/status")
    public UserAdminResponse status(@PathVariable Long id, @Valid @RequestBody UserStatusRequest request) {
        return response(users.setStatus(id, request.status()));
    }

    @PostMapping("/{id}/verification-email")
    public ResponseEntity<Void> resendVerification(@PathVariable Long id) {
        users.resendVerification(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/verify")
    public UserAdminResponse markVerified(@PathVariable Long id) { return response(users.markVerified(id)); }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) { users.delete(id); }

    @GetMapping(value = "/export", produces = "text/csv")
    public ResponseEntity<StreamingResponseBody> export() {
        List<User> list = users.listAll(UserSearch.ANYONE);
        StreamingResponseBody body = out -> {
            out.write("id;email;firstName;lastName;status;provider;verified;createdAt;phone;country;situation;goal;city;marketingConsent;completion\n".getBytes(StandardCharsets.UTF_8));
            for (User user : list) {
                String row = csvLine(user.getId(), user.getEmail(), user.getFirstName(), user.getLastName(),
                        user.getStatus(), user.getProvider(), user.isEmailVerified(),
                        user.getCreatedAt() == null ? "" : formatter.format(user.getCreatedAt()),
                        nullToEmpty(user.getPhone()), nullToEmpty(user.getCountry()), user.getSituation() == null ? "" : user.getSituation(),
                        user.getGoal() == null ? "" : user.getGoal(), nullToEmpty(user.getLocation()), user.isMarketingConsent(),
                        ProfileCompletion.of(user).percent());
                out.write((row + "\n").getBytes(StandardCharsets.UTF_8));
            }
        };
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=lescracks-users.csv")
                .body(body);
    }

    private UserAdminResponse response(User user) {
        return new UserAdminResponse(user.getId(), user.getEmail(), user.getFirstName(),
                user.getLastName(), user.getStatus(), user.isEmailVerified(), user.getProvider(), user.getCreatedAt(),
                user.getPhone(), user.getCountry(), user.getSituation(), user.getGoal(), user.getLocation(),
                user.isMarketingConsent(), ProfileCompletion.of(user).percent(),
                user.hasLoginMethod(), user.getOnboardedAt() != null, user.getLastSeenAt(), user.getSignupPath());
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

    private static String nullToEmpty(String value) {
        return value == null ? "" : value;
    }
}
