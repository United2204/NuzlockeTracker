package com.nuzlocketracker.catalog.controller;

import com.nuzlocketracker.catalog.dto.*;
import com.nuzlocketracker.catalog.service.CatalogService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/catalog")
@RequiredArgsConstructor
public class CatalogController {

    private final CatalogService catalogService;

    @GetMapping("/games")
    public ResponseEntity<List<GameResponse>> listGames() {
        return ResponseEntity.ok(catalogService.listGames());
    }

    @GetMapping("/games/{gameId}/routes")
    public ResponseEntity<List<RouteResponse>> listRoutes(
            @PathVariable Long gameId,
            @RequestParam(defaultValue = "en") String lang
    ) {
        return ResponseEntity.ok(catalogService.listRoutesByGame(gameId, lang));
    }

    @GetMapping("/games/{gameId}/badges")
    public ResponseEntity<List<BadgeResponse>> listBadges(
            @PathVariable Long gameId,
            @RequestParam(defaultValue = "en") String lang
    ) {
        return ResponseEntity.ok(catalogService.getBadgesForGame(gameId, lang));
    }

    @GetMapping("/routes/{routeId}/encounter-suggestions")
    public ResponseEntity<List<EncounterSuggestionResponse>> encounterSuggestions(
            @PathVariable Long routeId,
            @RequestParam(required = false) String gameVersion
    ) {
        return ResponseEntity.ok(catalogService.getEncounterSuggestions(routeId, gameVersion));
    }

    @GetMapping("/pokemon/{id}")
    public ResponseEntity<PokemonDetailResponse> getPokemon(
            @PathVariable Long id,
            @RequestParam(defaultValue = "en") String lang
    ) {
        return ResponseEntity.ok(catalogService.getPokemonDetail(id, lang));
    }

    @GetMapping("/pokemon/search")
    public ResponseEntity<List<PokemonSearchResponse>> searchPokemon(
            @RequestParam String q,
            @RequestParam(defaultValue = "en") String lang
    ) {
        return ResponseEntity.ok(catalogService.searchPokemon(q, lang));
    }

    @GetMapping("/pokemon/{pokemonId}/evolutions")
    public ResponseEntity<List<PokemonSearchResponse>> getEvolutions(
            @PathVariable Long pokemonId,
            @RequestParam(defaultValue = "en") String lang
    ) {
        return ResponseEntity.ok(catalogService.getEvolutionChain(pokemonId, lang));
    }
}
