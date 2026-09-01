package com.brandonkamga.lescracks.mapper;

import com.brandonkamga.lescracks.domain.User;
import com.brandonkamga.lescracks.dto.user.UserResponse;
import org.springframework.stereotype.Component;

@Component
public class UserMapper {

    private final MediaMapper mediaMapper;

    public UserMapper(MediaMapper mediaMapper) {
        this.mediaMapper = mediaMapper;
    }

    /** The Keycloak subject is deliberately absent: it is an internal join key. */
    public UserResponse toResponse(User user) {
        return new UserResponse(
                user.getId(),
                user.getEmail(),
                user.getDisplayName(),
                mediaMapper.toResponse(user.getAvatar()),
                user.getCreatedAt());
    }
}
