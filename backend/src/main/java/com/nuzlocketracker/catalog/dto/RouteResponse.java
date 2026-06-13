package com.nuzlocketracker.catalog.dto;

import com.nuzlocketracker.catalog.entity.Route;

public record RouteResponse(
        Long id,
        String name,
        int displayOrder,
        String encounterType,
        Long requiredBadgeId,
        String requiredBadgeName
) {
    public static RouteResponse from(Route r) {
        return from(r, null);
    }

    public static RouteResponse from(Route r, String localizedName) {
        return new RouteResponse(
                r.getId(),
                localizedName != null ? localizedName : r.getName(),
                r.getDisplayOrder(),
                r.getEncounterType().name(),
                r.getRequiredBadge() != null ? r.getRequiredBadge().getId() : null,
                r.getRequiredBadge() != null ? r.getRequiredBadge().getName() : null
        );
    }
}
