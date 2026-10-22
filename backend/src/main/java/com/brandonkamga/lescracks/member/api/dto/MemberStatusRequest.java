package com.brandonkamga.lescracks.member.api.dto;

import com.brandonkamga.lescracks.account.domain.model.AccountStatus;

import jakarta.validation.constraints.NotNull;

public record MemberStatusRequest(@NotNull AccountStatus status) {
}
