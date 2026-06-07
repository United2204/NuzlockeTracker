package com.nuzlocketracker.social.dto;

import java.time.OffsetDateTime;

public record NotificationResponse(
        Long id,
        String type,
        Long referenceId,
        boolean read,
        OffsetDateTime createdAt
) {}
