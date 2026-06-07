package com.nuzlocketracker.sync.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record BatchSyncRequest(
        @NotNull @Valid List<SyncRunDto> runs,
        @NotNull @Valid List<SyncEncounterDto> encounters,
        @NotNull @Valid List<SyncCaughtPokemonDto> caughtPokemon
) {}
