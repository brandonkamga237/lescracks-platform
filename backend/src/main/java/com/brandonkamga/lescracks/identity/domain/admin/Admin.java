package com.brandonkamga.lescracks.identity.domain.admin;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/** An administrator: a local account with a username, distinct from members. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Admin {

    private Long id;

    private String username;

    private String passwordHash;

    @Builder.Default
    private AdminStatus status = AdminStatus.ACTIVE;

    @Builder.Default
    private Instant createdAt = Instant.now();

    @Builder.Default
    private Instant updatedAt = Instant.now();

    public boolean isActive() {
        return status == AdminStatus.ACTIVE;
    }
}
