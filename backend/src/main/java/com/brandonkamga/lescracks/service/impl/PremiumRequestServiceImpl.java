package com.brandonkamga.lescracks.service.impl;

import com.brandonkamga.lescracks.domain.*;
import com.brandonkamga.lescracks.exception.BadRequestException;
import com.brandonkamga.lescracks.exception.ResourceNotFoundException;
import com.brandonkamga.lescracks.repository.PremiumRequestRepository;
import com.brandonkamga.lescracks.repository.RoleRepository;
import com.brandonkamga.lescracks.repository.UserRepository;
import com.brandonkamga.lescracks.service.interfaces.PremiumRequestService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
@Transactional
public class PremiumRequestServiceImpl implements PremiumRequestService {

    private final PremiumRequestRepository premiumRequestRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;

    public PremiumRequestServiceImpl(
            PremiumRequestRepository premiumRequestRepository,
            UserRepository userRepository,
            RoleRepository roleRepository) {
        this.premiumRequestRepository = premiumRequestRepository;
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
    }

    @Override
    public PremiumRequest submitRequest(Long userId, String whatsappNumber, String country, String message) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        // Prevent duplicate pending requests
        Optional<PremiumRequest> existing = premiumRequestRepository.findTopByUserIdOrderByCreatedAtDesc(userId);
        if (existing.isPresent()) {
            PremiumRequestStatus existingStatus = existing.get().getStatus();
            if (existingStatus == PremiumRequestStatus.PENDING || existingStatus == PremiumRequestStatus.CONTACTED) {
                throw new BadRequestException("Vous avez déjà une demande PREMIUM en cours de traitement");
            }
        }

        // Prevent if already premium
        if (user.getRole() != null && user.getRole().getName() == RoleName.premium_user) {
            throw new BadRequestException("Votre compte est déjà PREMIUM");
        }

        PremiumRequest request = PremiumRequest.builder()
                .user(user)
                .whatsappNumber(whatsappNumber)
                .country(country)
                .message(message)
                .status(PremiumRequestStatus.PENDING)
                .build();

        PremiumRequest saved = premiumRequestRepository.save(request);

        // Log notification (can be replaced with email/Slack/webhook later)
        System.out.println("[PREMIUM REQUEST] Nouvelle demande de l'utilisateur: "
                + user.getEmail() + " | WhatsApp: " + whatsappNumber + " | Pays: " + country);

        return saved;
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<PremiumRequest> getLatestRequestByUser(Long userId) {
        return premiumRequestRepository.findTopByUserIdOrderByCreatedAtDesc(userId);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<PremiumRequest> getAllRequests(Pageable pageable) {
        return premiumRequestRepository.findAllByOrderByCreatedAtDesc(pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<PremiumRequest> getRequestsByStatus(PremiumRequestStatus status, Pageable pageable) {
        return premiumRequestRepository.findByStatusOrderByCreatedAtDesc(status, pageable);
    }

    @Override
    public PremiumRequest updateRequestStatus(Long requestId, PremiumRequestStatus status) {
        PremiumRequest request = premiumRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("PremiumRequest", "id", requestId));

        request.setStatus(status);

        // Activate premium when payment is confirmed
        if (status == PremiumRequestStatus.PAID) {
            User user = request.getUser();
            Role premiumRole = roleRepository.findByName(RoleName.premium_user)
                    .orElseThrow(() -> new RuntimeException("Role PREMIUM_USER not found"));
            user.setRole(premiumRole);
            user.setPremiumActivatedAt(LocalDateTime.now());
            userRepository.save(user);
        }

        return premiumRequestRepository.save(request);
    }

    @Override
    @Transactional(readOnly = true)
    public long countByStatus(PremiumRequestStatus status) {
        return premiumRequestRepository.countByStatus(status);
    }
}
