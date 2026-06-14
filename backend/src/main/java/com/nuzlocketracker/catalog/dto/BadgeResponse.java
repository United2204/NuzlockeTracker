package com.nuzlocketracker.catalog.dto;

import com.nuzlocketracker.catalog.entity.Badge;

public record BadgeResponse(
        Long id,
        String name,
        int displayOrder,
        String imageUrl
) {
    public static BadgeResponse from(Badge b) {
        return from(b, null);
    }

    public static BadgeResponse from(Badge b, String localizedName) {
        return new BadgeResponse(b.getId(),
                localizedName != null ? localizedName : b.getName(),
                b.getDisplayOrder(), b.getImageUrl());
    }
}
