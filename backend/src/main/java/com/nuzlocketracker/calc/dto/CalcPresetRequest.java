package com.nuzlocketracker.calc.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CalcPresetRequest(
        @NotBlank String name,
        @NotNull Long pokemonId,
        String formVariant,
        @Min(1) @Max(100) Short level,
        @Min(0) @Max(252) Short evHp,
        @Min(0) @Max(252) Short evAtk,
        @Min(0) @Max(252) Short evDef,
        @Min(0) @Max(252) Short evSpAtk,
        @Min(0) @Max(252) Short evSpDef,
        @Min(0) @Max(252) Short evSpe,
        @Min(0) @Max(31) Short ivHp,
        @Min(0) @Max(31) Short ivAtk,
        @Min(0) @Max(31) Short ivDef,
        @Min(0) @Max(31) Short ivSpAtk,
        @Min(0) @Max(31) Short ivSpDef,
        @Min(0) @Max(31) Short ivSpe,
        String nature,
        Long abilityId,
        Long itemId
) {}
