package com.nuzlocketracker.calc.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record StatOverrideRequest(
        @NotNull @Min(1) @Max(255) Short hp,
        @NotNull @Min(1) @Max(255) Short attack,
        @NotNull @Min(1) @Max(255) Short defense,
        @NotNull @Min(1) @Max(255) Short spAtk,
        @NotNull @Min(1) @Max(255) Short spDef,
        @NotNull @Min(1) @Max(255) Short speed
) {}
