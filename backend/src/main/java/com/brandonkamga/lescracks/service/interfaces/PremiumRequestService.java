package com.brandonkamga.lescracks.service.interfaces;

import com.brandonkamga.lescracks.domain.PremiumRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.Optional;

public interface PremiumRequestService {

    /**
     * Submit a new premium request. Throws if user already has a pending request or is already premium.
     */
    PremiumRequest submitRequest(Long userId, String whatsappNumber, String contactEmail, String country, String message);

    /**
     * Get the pending request for a user (if any).
     */
    Optional<PremiumRequest> getPendingRequestByUser(Long userId);

    /**
     * Get all pending requests (admin).
     */
    Page<PremiumRequest> getAllRequests(Pageable pageable);

    /**
     * Accept request: activate premium for the given duration, send email, delete the request.
     */
    void acceptRequest(Long requestId, int months);

    /**
     * Reject request: delete the request with no further action.
     */
    void rejectRequest(Long requestId);

    /**
     * Count pending requests (admin dashboard).
     */
    long countPending();
}
