package com.nuzlocketracker.run.dto;

import com.nuzlocketracker.run.entity.CaughtPokemon;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public record CaughtPokemonResponse(
        UUID id,
        Long originalPokemonId,
        Long currentPokemonId,
        String currentPokemonName,
        List<String> currentPokemonTypes,
        String currentPokemonSpriteUrl,
        String nickname,
        boolean shiny,
        String status,
        OffsetDateTime caughtAt,
        Long routeId,
        String routeName
) {
    public static CaughtPokemonResponse from(CaughtPokemon cp, String pokemonName) {
        return new CaughtPokemonResponse(
                cp.getId(),
                cp.getOriginalPokemon().getId(),
                cp.getCurrentPokemon().getId(),
                pokemonName,
                cp.getCurrentPokemon().getTypes(),
                cp.getCurrentPokemon().getSpriteUrl(),
                cp.getNickname(),
                cp.isShiny(),
                cp.getStatus().name(),
                cp.getCaughtAt(),
                cp.getRouteEncounter().getRoute().getId(),
                cp.getRouteEncounter().getRoute().getName()
        );
    }
}
