package com.nuzlocketracker.auth.dto;

import com.nuzlocketracker.auth.entity.User;

import java.time.OffsetDateTime;
import java.util.UUID;

public record MeResponse(
        UUID id,
        String email,
        String username,
        String role,
        boolean emailVerified,
        boolean verified,
        OffsetDateTime createdAt
) {
    public static MeResponse from(User user) {
        return new MeResponse(
                user.getId(),
                user.getEmail(),
                user.getUsername(),
                user.getRole().name(),
                user.isEmailVerified(),
                user.isVerified(),
                user.getCreatedAt()
        );
    }
}
