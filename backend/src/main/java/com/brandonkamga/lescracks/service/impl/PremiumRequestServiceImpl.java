package com.brandonkamga.lescracks.service.impl;

import com.brandonkamga.lescracks.domain.PremiumRequest;
import com.brandonkamga.lescracks.domain.RoleName;
import com.brandonkamga.lescracks.domain.User;
import com.brandonkamga.lescracks.exception.BadRequestException;
import com.brandonkamga.lescracks.exception.ResourceNotFoundException;
import com.brandonkamga.lescracks.repository.PremiumRequestRepository;
import com.brandonkamga.lescracks.repository.RoleRepository;
import com.brandonkamga.lescracks.repository.UserRepository;
import com.brandonkamga.lescracks.service.interfaces.PremiumRequestService;
import org.springframework.beans.factory.annotation.Value;
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
    private final MailServiceImpl mailService;

    @Value("${app.mail.admin:contact@lescracks.com}")
    private String adminEmail;

    public PremiumRequestServiceImpl(
            PremiumRequestRepository premiumRequestRepository,
            UserRepository userRepository,
            RoleRepository roleRepository,
            MailServiceImpl mailService) {
        this.premiumRequestRepository = premiumRequestRepository;
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.mailService = mailService;
    }

    @Override
    public PremiumRequest submitRequest(Long userId, String whatsappNumber, String contactEmail, String country, String message) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        if (user.getRole() != null && user.getRole().getName() == RoleName.premium_user) {
            throw new BadRequestException("Votre compte est déjà PREMIUM");
        }

        if (premiumRequestRepository.existsByUserId(userId)) {
            throw new BadRequestException("Vous avez déjà une demande en cours de traitement");
        }

        PremiumRequest request = PremiumRequest.builder()
                .user(user)
                .whatsappNumber(whatsappNumber)
                .contactEmail(contactEmail)
                .country(country)
                .message(message)
                .build();

        PremiumRequest saved = premiumRequestRepository.save(request);

        // Notify user: request received
        mailService.sendPremiumRequestReceived(contactEmail, user.getUsername());
        // Notify admin: new request
        mailService.sendNewPremiumRequestAdmin(adminEmail, user.getUsername(), user.getEmail(), whatsappNumber, contactEmail, country, message);

        return saved;
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<PremiumRequest> getPendingRequestByUser(Long userId) {
        return premiumRequestRepository.findTopByUserIdOrderByCreatedAtDesc(userId);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<PremiumRequest> getAllRequests(Pageable pageable) {
        return premiumRequestRepository.findAllByOrderByCreatedAtDesc(pageable);
    }

    @Override
    public void acceptRequest(Long requestId, int months) {
        if (months < 1 || months > 24) {
            throw new BadRequestException("La durée doit être entre 1 et 24 mois");
        }

        PremiumRequest request = premiumRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("PremiumRequest", "id", requestId));

        User user = request.getUser();

        // Activate premium
        var premiumRole = roleRepository.findByName(RoleName.premium_user)
                .orElseThrow(() -> new RuntimeException("Rôle PREMIUM_USER introuvable en base"));

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime expiresAt = now.plusMonths(months);

        user.setRole(premiumRole);
        user.setPremiumActivatedAt(now);
        user.setPremiumExpiresAt(expiresAt);
        user.setPremiumContactEmail(request.getContactEmail());
        userRepository.save(user);

        // Send activation email to contact email provided in the request
        mailService.sendPremiumActivated(request.getContactEmail(), user.getUsername(), expiresAt, months);

        // Delete the request — it has served its purpose
        premiumRequestRepository.delete(request);
    }

    @Override
    public void rejectRequest(Long requestId) {
        PremiumRequest request = premiumRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("PremiumRequest", "id", requestId));

        // Delete silently — rejection is handled on WhatsApp
        premiumRequestRepository.delete(request);
    }

    @Override
    @Transactional(readOnly = true)
    public long countPending() {
        return premiumRequestRepository.count();
    }
}
