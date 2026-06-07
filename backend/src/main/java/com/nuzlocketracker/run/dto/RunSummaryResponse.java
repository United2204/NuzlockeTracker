package com.nuzlocketracker.run.dto;

import com.nuzlocketracker.run.entity.Run;

import java.time.OffsetDateTime;
import java.util.UUID;

public record RunSummaryResponse(
        UUID id,
        String name,
        String slug,
        Long gameId,
        String gameName,
        String gameVersion,
        boolean randomized,
        String status,
        String visibility,
        boolean favorite,
        int displayOrder,
        long activePokemon,
        long faintedPokemon,
        OffsetDateTime startedAt,
        OffsetDateTime lastActivityAt
) {
    public static RunSummaryResponse from(Run run, long active, long fainted) {
        return new RunSummaryResponse(
                run.getId(),
                run.getName(),
                run.getSlug(),
                run.getGame().getId(),
                run.getGame().getName(),
                run.getGameVersion(),
                run.isRandomized(),
                run.getStatus().name(),
                run.getVisibility().name(),
                run.isFavorite(),
                run.getDisplayOrder(),
                active,
                fainted,
                run.getStartedAt(),
                run.getLastActivityAt()
        );
    }
}
