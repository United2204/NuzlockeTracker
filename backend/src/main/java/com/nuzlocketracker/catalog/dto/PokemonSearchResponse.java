package com.nuzlocketracker.catalog.dto;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.nuzlocketracker.catalog.repository.PokemonSearchProjection;

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
    private static final ObjectMapper MAPPER = new ObjectMapper();
    private static final TypeReference<List<String>> LIST_STRING = new TypeReference<>() {};

    public static PokemonSearchResponse from(PokemonSearchProjection p) {
        List<String> types;
        try {
            types = MAPPER.readValue(p.getTypesJson(), LIST_STRING);
        } catch (Exception e) {
            types = List.of();
        }
        return new PokemonSearchResponse(
                p.getId(), p.getSpeciesId(), p.getNationalDexNumber(),
                types, p.getSpriteUrl(), p.getVariant(), p.getName()
        );
    }
}
