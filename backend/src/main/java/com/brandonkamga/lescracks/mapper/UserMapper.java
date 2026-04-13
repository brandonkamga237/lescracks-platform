package com.brandonkamga.lescracks.mapper;

import com.brandonkamga.lescracks.domain.Provider;
import com.brandonkamga.lescracks.domain.ProviderType;
import com.brandonkamga.lescracks.domain.RoleName;
import com.brandonkamga.lescracks.domain.User;
import com.brandonkamga.lescracks.dto.UserRequest;
import com.brandonkamga.lescracks.dto.UserResponse;
import com.brandonkamga.lescracks.exception.ResourceNotFoundException;
import com.brandonkamga.lescracks.repository.ProviderRepository;
import com.brandonkamga.lescracks.repository.RoleRepository;
import org.springframework.stereotype.Component;

@Component
public class UserMapper {

    private final RoleRepository roleRepository;
    private final ProviderRepository providerRepository;

    public UserMapper(RoleRepository roleRepository, ProviderRepository providerRepository) {
        this.roleRepository = roleRepository;
        this.providerRepository = providerRepository;
    }

    public UserResponse toResponse(User user) {
        if (user == null) {
            return null;
        }

        // Determine picture: stored pictureUrl first, then imageAsset if present
        String picture = user.getPictureUrl();
        if (picture == null && user.getImageAsset() != null) {
            picture = user.getImageAsset().getUrl();
        }

        return UserResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .phone(user.getPhone())
                .country(user.getCountry())
                .providerName(user.getProvider() != null ? user.getProvider().getProviderName().name() : null)
                .providerUserId(user.getProviderUserId())
                .roleName(user.getRole() != null ? user.getRole().getName().name() : null)
                .picture(picture)
                .premiumActivatedAt(user.getPremiumActivatedAt())
                .premiumExpiresAt(user.getPremiumExpiresAt())
                .build();
    }

    public User toEntity(UserRequest request) {
        if (request == null) {
            return null;
        }

        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPhone(request.getPhone());
        user.setCountry(request.getCountry());

        if (request.getRoleName() != null) {
            try {
                RoleName roleName = RoleName.valueOf(request.getRoleName());
                user.setRole(roleRepository.findByName(roleName)
                        .orElseThrow(() -> new ResourceNotFoundException("Role", "name", request.getRoleName())));
            } catch (IllegalArgumentException e) {
                throw new ResourceNotFoundException("Role", "name", request.getRoleName());
            }
        }

        // Handle provider (for local registration)
        if (request.getProviderName() != null) {
            try {
                ProviderType providerType = ProviderType.valueOf(request.getProviderName());
                Provider provider = providerRepository.findByProviderName(providerType)
                        .orElseThrow(() -> new ResourceNotFoundException("Provider", "name", request.getProviderName()));
                user.setProvider(provider);
            } catch (IllegalArgumentException e) {
                throw new ResourceNotFoundException("Provider", "name", request.getProviderName());
            }
        }

        user.setProviderUserId(request.getProviderUserId());

        return user;
    }

    public User updateEntity(User user, UserRequest request) {
        if (request == null || user == null) {
            return user;
        }

        if (request.getUsername() != null) {
            user.setUsername(request.getUsername());
        }
        if (request.getEmail() != null) {
            user.setEmail(request.getEmail());
        }
        if (request.getPhone() != null) {
            user.setPhone(request.getPhone());
        }
        if (request.getCountry() != null) {
            user.setCountry(request.getCountry());
        }
        if (request.getRoleName() != null) {
            try {
                RoleName roleName = RoleName.valueOf(request.getRoleName());
                user.setRole(roleRepository.findByName(roleName)
                        .orElseThrow(() -> new ResourceNotFoundException("Role", "name", request.getRoleName())));
            } catch (IllegalArgumentException e) {
                throw new ResourceNotFoundException("Role", "name", request.getRoleName());
            }
        }

        return user;
    }
}
