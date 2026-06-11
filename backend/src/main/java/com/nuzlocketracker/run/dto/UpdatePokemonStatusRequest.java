package com.nuzlocketracker.run.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdatePokemonStatusRequest(
        @NotBlank String status,
        @Size(max = 500) String notes,
        boolean correction
) {}
