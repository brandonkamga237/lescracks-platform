package com.brandonkamga.lescracks.service.interfaces;

import com.brandonkamga.lescracks.domain.PremiumRequest;
import com.brandonkamga.lescracks.domain.PremiumRequestStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.Optional;

public interface PremiumRequestService {

    /**
     * Submit a new premium request for the given user.
     */
    PremiumRequest submitRequest(Long userId, String whatsappNumber, String country, String message);

    /**
     * Get the latest premium request for a user.
     */
    Optional<PremiumRequest> getLatestRequestByUser(Long userId);

    /**
     * Get all premium requests (admin use).
     */
    Page<PremiumRequest> getAllRequests(Pageable pageable);

    /**
     * Get premium requests by status (admin use).
     */
    Page<PremiumRequest> getRequestsByStatus(PremiumRequestStatus status, Pageable pageable);

    /**
     * Update request status. When status is PAID, activates the user's premium account.
     */
    PremiumRequest updateRequestStatus(Long requestId, PremiumRequestStatus status);

    /**
     * Count requests by status.
     */
    long countByStatus(PremiumRequestStatus status);
}
