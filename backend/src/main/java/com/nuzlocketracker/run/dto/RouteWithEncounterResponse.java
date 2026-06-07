package com.nuzlocketracker.run.dto;

import com.nuzlocketracker.catalog.entity.Route;
import com.nuzlocketracker.run.entity.RouteEncounter;

import java.time.OffsetDateTime;
import java.util.UUID;

public record RouteWithEncounterResponse(
        Long routeId,
        String routeName,
        String encounterType,
        int routeOrder,
        Long requiredBadgeId,
        String requiredBadgeName,
        // encounter (null si no se interactuó aún)
        UUID encounterId,
        String outcome,
        CaughtPokemonResponse caughtPokemon,
        String notes,
        OffsetDateTime encounteredAt
) {
    public static RouteWithEncounterResponse noEncounter(Route route) {
        return new RouteWithEncounterResponse(
                route.getId(),
                route.getName(),
                route.getEncounterType().name(),
                route.getDisplayOrder(),
                route.getRequiredBadge() != null ? route.getRequiredBadge().getId() : null,
                route.getRequiredBadge() != null ? route.getRequiredBadge().getName() : null,
                null, "PENDING", null, null, null
        );
    }

    public static RouteWithEncounterResponse withEncounter(Route route, RouteEncounter enc,
                                                            CaughtPokemonResponse caught) {
        return new RouteWithEncounterResponse(
                route.getId(),
                route.getName(),
                route.getEncounterType().name(),
                route.getDisplayOrder(),
                route.getRequiredBadge() != null ? route.getRequiredBadge().getId() : null,
                route.getRequiredBadge() != null ? route.getRequiredBadge().getName() : null,
                enc.getId(),
                enc.getOutcome().name(),
                caught,
                enc.getNotes(),
                enc.getEncounteredAt()
        );
    }
}
