package com.nuzlocketracker.sync.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

public record BatchSyncRequest(
        @NotNull @Valid @Size(max = 200) List<SyncRunDto> runs,
        @NotNull @Valid @Size(max = 1000) List<SyncEncounterDto> encounters,
        @NotNull @Valid @Size(max = 1000) List<SyncCaughtPokemonDto> caughtPokemon
) {}
