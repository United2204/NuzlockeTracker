package com.nuzlocketracker.auth.dto;

import com.nuzlocketracker.auth.entity.User;

import java.time.OffsetDateTime;
import java.util.UUID;

public record MeResponse(
        UUID id,
        String email,
        String username,
        String avatarUrl,
        String role,
        boolean emailVerified,
        boolean verified,
        OffsetDateTime lastUsernameChangedAt,
        OffsetDateTime createdAt
) {
    public static MeResponse from(User user) {
        return new MeResponse(
                user.getId(),
                user.getEmail(),
                user.getUsername(),
                user.getAvatarUrl(),
                user.getRole().name(),
                user.isEmailVerified(),
                user.isVerified(),
                user.getLastUsernameChangedAt(),
                user.getCreatedAt()
        );
    }
}
