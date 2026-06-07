package com.nuzlocketracker.catalog.dto;

import com.nuzlocketracker.catalog.entity.Badge;

public record BadgeResponse(
        Long id,
        String name,
        int displayOrder,
        String imageUrl
) {
    public static BadgeResponse from(Badge b) {
        return new BadgeResponse(b.getId(), b.getName(), b.getDisplayOrder(), b.getImageUrl());
    }
}
