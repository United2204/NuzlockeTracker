package com.nuzlocketracker.calc.dto;

public record StatOverrideResponse(
        Long pokemonId,
        short hp,
        short attack,
        short defense,
        short spAtk,
        short spDef,
        short speed
) {}
