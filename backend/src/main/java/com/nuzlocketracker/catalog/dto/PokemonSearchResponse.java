package com.nuzlocketracker.catalog.dto;

import com.nuzlocketracker.catalog.entity.Pokemon;

import java.util.List;

public record PokemonSearchResponse(
        Long id,
        Long speciesId,
        Integer nationalDexNumber,
        List<String> types,
        String spriteUrl,
        String variant,
        String name
) {
    public static PokemonSearchResponse from(Pokemon p, String name) {
        return new PokemonSearchResponse(
                p.getId(),
                p.getSpeciesId(),
                p.getNationalDexNumber() != null ? p.getNationalDexNumber().intValue() : null,
                p.getTypes(),
                p.getSpriteUrl(),
                p.getVariant(),
                name
        );
    }
}
