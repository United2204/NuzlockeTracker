package com.nuzlocketracker.sync.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.OffsetDateTime;
import java.util.UUID;

public record SyncEncounterDto(
        @NotNull UUID id,
        @NotNull UUID runId,
        @NotNull Long routeId,
        @NotBlank String outcome,
        String notes,
        OffsetDateTime encounteredAt
) {}
