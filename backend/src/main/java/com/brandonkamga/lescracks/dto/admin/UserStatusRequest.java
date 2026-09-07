package com.brandonkamga.lescracks.dto.admin;

import com.brandonkamga.lescracks.domain.UserStatus;
import jakarta.validation.constraints.NotNull;

public record UserStatusRequest(@NotNull UserStatus status) {
}