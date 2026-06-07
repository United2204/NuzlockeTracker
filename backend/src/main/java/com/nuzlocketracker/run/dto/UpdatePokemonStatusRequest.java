package com.nuzlocketracker.run.dto;

import jakarta.validation.constraints.NotBlank;

public record UpdatePokemonStatusRequest(
        @NotBlank String status,   // ACTIVE, BOXED, FAINTED
        String notes,              // contexto (especialmente para FAINTED)
        boolean correction         // true = corrección de un error, no evento real
) {}
