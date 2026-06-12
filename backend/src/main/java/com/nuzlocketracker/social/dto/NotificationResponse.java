package com.nuzlocketracker.social.dto;

import com.nuzlocketracker.social.entity.Notification;

import java.time.OffsetDateTime;

public record NotificationResponse(
        Long id,
        String type,
        Long referenceId,
        String actorUsername,
        boolean read,
        OffsetDateTime createdAt
) {
    public static NotificationResponse from(Notification n) {
        return new NotificationResponse(
                n.getId(),
                n.getType().name(),
                n.getReferenceId(),
                n.getActor() != null ? n.getActor().getUsername() : null,
                n.isRead(),
                n.getCreatedAt()
        );
    }
}
