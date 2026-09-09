package com.brandonkamga.lescracks.service.impl;

import com.brandonkamga.lescracks.domain.AuthProvider;
import com.brandonkamga.lescracks.domain.User;
import com.brandonkamga.lescracks.domain.UserIdentity;
import com.brandonkamga.lescracks.dto.auth.LinkIdentityRequest;
import com.brandonkamga.lescracks.dto.user.UserIdentityResponse;
import com.brandonkamga.lescracks.exception.BadRequestException;
import com.brandonkamga.lescracks.exception.ConflictException;
import com.brandonkamga.lescracks.exception.ForbiddenException;
import com.brandonkamga.lescracks.exception.NotFoundException;
import com.brandonkamga.lescracks.repository.UserIdentityRepository;
import com.brandonkamga.lescracks.repository.UserRepository;
import com.brandonkamga.lescracks.service.interfaces.UserIdentityService;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
@Transactional
public class UserIdentityServiceImpl implements UserIdentityService {

    private final UserRepository users;
    private final UserIdentityRepository identities;
    private final JwtDecoder jwtDecoder;

    public UserIdentityServiceImpl(UserRepository users, UserIdentityRepository identities, JwtDecoder jwtDecoder) {
        this.users = users;
        this.identities = identities;
        this.jwtDecoder = jwtDecoder;
    }

    @Override
    public List<UserIdentityResponse> list(String email) {
        User user = requireUser(email);
        return identities.findByUser(user).stream()
                .map(identity -> new UserIdentityResponse(identity.getProvider(), identity.getCreatedAt()))
                .toList();
    }

    @Override
    public UserIdentityResponse link(String email, LinkIdentityRequest request) {
        if (request.provider() == AuthProvider.LOCAL) {
            throw new BadRequestException("Impossible de lier une connexion locale par ce flux.");
        }
        Jwt jwt = decodeToken(request.token());
        String tokenEmail = normalize(jwt.getClaimAsString("email"));
        String currentEmail = normalize(email);
        if (!tokenEmail.equals(currentEmail)) {
            throw new BadRequestException("L'adresse email du fournisseur ne correspond pas à celle du compte.");
        }

        User user = requireUser(email);
        String externalId = jwt.getSubject();
        if (externalId == null || externalId.isBlank()) {
            throw new BadRequestException("Identité externe invalide.");
        }

        identities.findByProviderAndExternalId(request.provider(), externalId).ifPresent(existing -> {
            if (!existing.getUser().getId().equals(user.getId())) {
                throw new ConflictException("Cette identité externe est déjà liée à un autre compte.");
            }
        });

        UserIdentity identity = identities.findByUserAndProvider(user, request.provider())
                .orElseGet(() -> UserIdentity.builder().user(user).provider(request.provider()).build());
        identity.setExternalId(externalId);
        identity.setUpdatedAt(Instant.now());
        identities.save(identity);

        return new UserIdentityResponse(identity.getProvider(), identity.getCreatedAt());
    }

    @Override
    public void unlink(String email, AuthProvider provider) {
        if (provider == AuthProvider.LOCAL) {
            throw new BadRequestException("Impossible de retirer une connexion locale par ce flux.");
        }
        User user = requireUser(email);
        UserIdentity identity = identities.findByUserAndProvider(user, provider)
                .orElseThrow(() -> new NotFoundException("Identité", "provider", provider));

        if (!canRemoveLoginMethod(user)) {
            throw new ForbiddenException("Tu dois conserver au moins une méthode de connexion.");
        }
        identities.delete(identity);
    }

    private boolean canRemoveLoginMethod(User user) {
        boolean hasPassword = user.getPasswordHash() != null && !user.getPasswordHash().isBlank();
        return hasPassword || identities.countByUser(user) > 1;
    }

    private Jwt decodeToken(String token) {
        try {
            return jwtDecoder.decode(token);
        } catch (Exception cause) {
            throw new BadRequestException("Jeton d'identité invalide ou expiré.");
        }
    }

    private User requireUser(String email) {
        return users.findByEmailIgnoreCase(normalize(email))
                .orElseThrow(() -> new NotFoundException("Utilisateur", "email", email));
    }

    private static String normalize(String value) {
        return value == null ? "" : value.trim().toLowerCase();
    }
}
