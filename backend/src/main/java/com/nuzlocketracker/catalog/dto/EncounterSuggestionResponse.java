package com.nuzlocketracker.catalog.dto;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.nuzlocketracker.catalog.repository.EncounterSuggestionProjection;

import java.util.List;

public record EncounterSuggestionResponse(
        Long id,
        String name,
        List<String> types,
        String spriteUrl,
        String variant,
        String encounterType,
        Integer rarity,
        String gameVersion
) {
    private static final ObjectMapper MAPPER = new ObjectMapper();
    private static final TypeReference<List<String>> LIST_STRING = new TypeReference<>() {};

    public static EncounterSuggestionResponse from(EncounterSuggestionProjection p) {
        List<String> types;
        try {
            types = MAPPER.readValue(p.getTypesJson(), LIST_STRING);
        } catch (Exception e) {
            types = List.of();
        }
        return new EncounterSuggestionResponse(
                p.getId(), p.getName(), types, p.getSpriteUrl(),
                p.getVariant(), p.getEncounterType(), p.getRarity(), p.getGameVersion()
        );
    }
}
