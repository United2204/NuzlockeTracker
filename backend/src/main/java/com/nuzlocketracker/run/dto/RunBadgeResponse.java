package com.nuzlocketracker.run.dto;

import com.nuzlocketracker.run.entity.RunBadge;

import java.time.OffsetDateTime;

public record RunBadgeResponse(Long badgeId, String badgeName, String badgeImageUrl, OffsetDateTime obtainedAt) {
    public static RunBadgeResponse from(RunBadge rb) {
        return from(rb, null);
    }

    public static RunBadgeResponse from(RunBadge rb, String localizedName) {
        return new RunBadgeResponse(
                rb.getBadge().getId(),
                localizedName != null ? localizedName : rb.getBadge().getName(),
                rb.getBadge().getImageUrl(),
                rb.getObtainedAt()
        );
    }
}
