package com.nuzlocketracker.sync.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record SyncCaughtPokemonDto(
        @NotNull UUID id,
        @NotNull UUID runId,
        @NotNull UUID routeEncounterId,
        @NotNull Long originalPokemonId,
        @NotNull Long currentPokemonId,
        String nickname,
        boolean shiny,
        @NotBlank String status
) {}
