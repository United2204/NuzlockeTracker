package com.nuzlocketracker.stats.dto;

import java.util.List;

public record RunStatsResponse(
        int routesAttempted,
        int routesCaptured,
        int routesFailed,
        int routesPending,
        int activeCount,
        int boxedCount,
        int faintedCount,
        List<DeathRecord> deaths,
        List<PokemonTimeRecord> teamTime
) {
    public record DeathRecord(
            String pokemonId,
            String name,
            String nickname,
            String spriteUrl,
            String notes,
            String faintedAt
    ) {}

    public record PokemonTimeRecord(
            String pokemonId,
            String name,
            String nickname,
            String spriteUrl,
            long secondsInTeam,
            String status
    ) {}
}
