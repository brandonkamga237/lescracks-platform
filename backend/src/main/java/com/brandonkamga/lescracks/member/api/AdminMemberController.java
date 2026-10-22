package com.brandonkamga.lescracks.member.api;

import com.brandonkamga.lescracks.account.application.AccountAdminService;
import com.brandonkamga.lescracks.account.domain.model.AccountSearch;
import com.brandonkamga.lescracks.member.api.dto.MemberAdminResponse;
import com.brandonkamga.lescracks.member.api.dto.MemberStatusRequest;
import com.brandonkamga.lescracks.member.application.MemberAdminService;
import com.brandonkamga.lescracks.member.application.MemberView;
import com.brandonkamga.lescracks.shared.dto.PageResponse;
import com.brandonkamga.lescracks.shared.paging.PageQuery;
import com.brandonkamga.lescracks.shared.util.Csv;

import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;

import java.nio.charset.StandardCharsets;
import java.util.List;

@RestController
@RequestMapping("/api/admin/users")
@PreAuthorize("hasRole('ADMIN')")
public class AdminMemberController {
    private static final int MAX_PAGE_SIZE = 100;

    private final MemberAdminService members;
    private final AccountAdminService accounts;

    public AdminMemberController(MemberAdminService members, AccountAdminService accounts) {
        this.members = members;
        this.accounts = accounts;
    }

    /** Newest first. {@code kind}: MEMBER (can sign in) or CONTACT (newsletter only); {@code verified}: email confirmed or not. */
    @GetMapping
    public PageResponse<MemberAdminResponse> list(@RequestParam(required = false) String search,
                                                  @RequestParam(required = false) AccountSearch.Kind kind,
                                                  @RequestParam(required = false) Boolean verified,
                                                  @RequestParam(defaultValue = "0") int page,
                                                  @RequestParam(defaultValue = "20") int size) {
        PageQuery query = new PageQuery(Math.max(0, page), Math.clamp(size, 1, MAX_PAGE_SIZE));
        return PageResponse.of(members.list(new AccountSearch(search, kind, verified), query), MemberAdminResponse::of);
    }

    @GetMapping("/{id}")
    public MemberAdminResponse get(@PathVariable Long id) { return MemberAdminResponse.of(members.require(id)); }

    @PatchMapping("/{id}/status")
    public MemberAdminResponse status(@PathVariable Long id, @Valid @RequestBody MemberStatusRequest request) {
        return MemberAdminResponse.of(members.setStatus(id, request.status()));
    }

    @PostMapping("/{id}/verification-email")
    public ResponseEntity<Void> resendVerification(@PathVariable Long id) {
        accounts.resendVerification(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/verify")
    public MemberAdminResponse markVerified(@PathVariable Long id) { return MemberAdminResponse.of(members.markVerified(id)); }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) { accounts.delete(id); }

    @GetMapping(value = "/export", produces = "text/csv")
    public ResponseEntity<StreamingResponseBody> export() {
        List<MemberView> list = members.listAll(AccountSearch.ANYONE);
        StreamingResponseBody body = out -> {
            out.write("id;email;firstName;lastName;status;provider;verified;createdAt;phone;country;situation;goal;city;marketingConsent;completion\n".getBytes(StandardCharsets.UTF_8));
            for (MemberView view : list) {
                var account = view.account();
                var profile = view.profile();
                out.write(Csv.line(account.getId(), account.getEmail(), account.getFirstName(), account.getLastName(),
                        account.getStatus(), account.getProvider(), account.isEmailVerified(), account.getCreatedAt(),
                        profile.getPhone(), profile.getCountry(), profile.getSituation(), profile.getGoal(),
                        profile.getLocation(), profile.isMarketingConsent(), view.completion().percent())
                        .getBytes(StandardCharsets.UTF_8));
            }
        };
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=lescracks-users.csv")
                .body(body);
    }
}
