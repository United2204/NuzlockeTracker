package com.nuzlocketracker.stats.dto;

import java.util.List;

public record UserStatsResponse(
        int totalRuns,
        int activeRuns,
        int completedRuns,
        int gameOverRuns,
        int abandonedRuns,
        int totalCaptures,
        int totalDeaths,
        List<MostCaughtEntry> mostCaught
) {
    public record MostCaughtEntry(
            long pokemonId,
            String name,
            String spriteUrl,
            int count
    ) {}
}
