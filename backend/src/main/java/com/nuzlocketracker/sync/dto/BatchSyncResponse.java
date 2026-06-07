package com.nuzlocketracker.sync.dto;

public record BatchSyncResponse(
        int runsCreated,
        int runsSkipped,
        int encountersCreated,
        int encountersSkipped,
        int caughtPokemonCreated,
        int caughtPokemonSkipped
) {}
