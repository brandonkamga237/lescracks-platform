package com.brandonkamga.lescracks.recognition.api;

import com.brandonkamga.lescracks.recognition.api.dto.AdminCertificateResponse;
import com.brandonkamga.lescracks.recognition.api.dto.CertificateResponse;
import com.brandonkamga.lescracks.recognition.api.dto.IssueRequest;
import com.brandonkamga.lescracks.recognition.domain.CertificateService;
import com.brandonkamga.lescracks.recognition.domain.CertificateView;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/certificates")
public class CertificateController {
    private final CertificateService certificates;

    public CertificateController(CertificateService certificates) {
        this.certificates = certificates;
    }

    /** Public: anyone holding the code checks the attestation, a recruiter included. */
    @GetMapping("/verify/{code}")
    public CertificateResponse verify(@PathVariable String code) {
        return CertificateResponse.of(certificates.verify(code));
    }

    @GetMapping("/mine")
    public List<CertificateResponse> mine(Principal principal) {
        return certificates.mine(principal.getName()).stream().map(CertificateResponse::of).toList();
    }

    @GetMapping("/admin/events/{eventId}")
    @PreAuthorize("hasRole('ADMIN')")
    public List<AdminCertificateResponse> forEvent(@PathVariable Long eventId) {
        return admin(certificates.forEvent(eventId));
    }

    @PostMapping("/admin/events/{eventId}/drafts")
    @PreAuthorize("hasRole('ADMIN')")
    public List<AdminCertificateResponse> prepare(@PathVariable Long eventId) {
        return admin(certificates.prepare(eventId));
    }

    /** Issues the drafts among the ids; the admin re-reads the event's list afterwards. */
    @PostMapping("/admin/issue")
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void issue(@Valid @RequestBody IssueRequest request) {
        certificates.issue(request.ids());
    }

    @PostMapping("/admin/{id}/revoke")
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void revoke(@PathVariable Long id) {
        certificates.revoke(id);
    }

    @DeleteMapping("/admin/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void discard(@PathVariable Long id) {
        certificates.discard(id);
    }

    private static List<AdminCertificateResponse> admin(List<CertificateView> views) {
        return views.stream().map(AdminCertificateResponse::of).toList();
    }
}
