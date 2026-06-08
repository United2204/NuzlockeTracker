package com.nuzlocketracker.run.dto;

import com.nuzlocketracker.run.entity.Run;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public record RunDetailResponse(
        UUID id,
        UUID userId,
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
        String basePresetName,
        List<RunRuleResponse> rules,
        List<RunBadgeResponse> badges,
        long activePokemon,
        long faintedPokemon,
        long boxedPokemon,
        OffsetDateTime startedAt,
        OffsetDateTime endedAt,
        OffsetDateTime lastActivityAt
) {
    public static RunDetailResponse from(Run run,
                                         List<RunRuleResponse> rules,
                                         List<RunBadgeResponse> badges,
                                         long active, long fainted, long boxed) {
        return new RunDetailResponse(
                run.getId(),
                run.getUser().getId(),
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
                run.getBasePreset() != null ? run.getBasePreset().getName() : null,
                rules,
                badges,
                active,
                fainted,
                boxed,
                run.getStartedAt(),
                run.getEndedAt(),
                run.getLastActivityAt()
        );
    }
}
