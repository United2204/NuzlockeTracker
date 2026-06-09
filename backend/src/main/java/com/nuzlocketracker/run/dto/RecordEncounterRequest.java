package com.nuzlocketracker.run.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.UUID;

public record RecordEncounterRequest(
        @NotNull Long routeId,
        @NotNull String outcome,     // CAPTURED, FAILED, DIED_IN_ENCOUNTER, NOT_FOUND, DEFERRED
        UUID encounterId,            // null = usar/crear slot disponible; no-null = editar slot específico
        Long pokemonId,              // requerido si outcome = CAPTURED
        @Size(max = 50) String nickname,
        boolean shiny,
        @Size(max = 500) String notes
) {}
