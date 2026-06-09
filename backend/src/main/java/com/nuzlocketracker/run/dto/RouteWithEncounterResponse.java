package com.nuzlocketracker.run.dto;

import com.nuzlocketracker.catalog.entity.Route;
import com.nuzlocketracker.run.entity.RouteEncounter;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public record RouteWithEncounterResponse(
        Long routeId,
        String routeName,
        String encounterType,
        int routeOrder,
        Long requiredBadgeId,
        String requiredBadgeName,
        List<EncounterSlot> slots
) {
    public record EncounterSlot(
            UUID id,
            String outcome,
            CaughtPokemonResponse caughtPokemon,
            String notes,
            OffsetDateTime encounteredAt
    ) {}

    public static RouteWithEncounterResponse build(Route route, List<RouteEncounter> encounters,
                                                    java.util.Map<UUID, CaughtPokemonResponse> pokemonByEncounterId) {
        List<EncounterSlot> slots = encounters.stream().map(enc -> {
            CaughtPokemonResponse cp = pokemonByEncounterId.get(enc.getId());
            return new EncounterSlot(enc.getId(), enc.getOutcome().name(), cp,
                    enc.getNotes(), enc.getEncounteredAt());
        }).toList();

        return new RouteWithEncounterResponse(
                route.getId(),
                route.getName(),
                route.getEncounterType().name(),
                route.getDisplayOrder(),
                route.getRequiredBadge() != null ? route.getRequiredBadge().getId() : null,
                route.getRequiredBadge() != null ? route.getRequiredBadge().getName() : null,
                slots
        );
    }
}
