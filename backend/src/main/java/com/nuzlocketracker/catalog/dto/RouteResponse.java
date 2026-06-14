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
        return from(r, null, null);
    }

    public static RouteResponse from(Route r, String localizedName) {
        return from(r, localizedName, null);
    }

    public static RouteResponse from(Route r, String localizedName, String localizedBadgeName) {
        String badgeName = r.getRequiredBadge() != null
                ? (localizedBadgeName != null ? localizedBadgeName : r.getRequiredBadge().getName())
                : null;
        return new RouteResponse(
                r.getId(),
                localizedName != null ? localizedName : r.getName(),
                r.getDisplayOrder(),
                r.getEncounterType().name(),
                r.getRequiredBadge() != null ? r.getRequiredBadge().getId() : null,
                badgeName
        );
    }
}
