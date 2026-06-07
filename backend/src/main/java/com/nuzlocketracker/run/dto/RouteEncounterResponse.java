package com.nuzlocketracker.run.dto;

import com.nuzlocketracker.run.entity.RouteEncounter;

import java.time.OffsetDateTime;
import java.util.UUID;

public record RouteEncounterResponse(
        UUID id,
        Long routeId,
        String routeName,
        String outcome,
        CaughtPokemonResponse caughtPokemon,
        String notes,
        OffsetDateTime encounteredAt
) {
    public static RouteEncounterResponse from(RouteEncounter enc, CaughtPokemonResponse caught) {
        return new RouteEncounterResponse(
                enc.getId(),
                enc.getRoute().getId(),
                enc.getRoute().getName(),
                enc.getOutcome().name(),
                caught,
                enc.getNotes(),
                enc.getEncounteredAt()
        );
    }
}
