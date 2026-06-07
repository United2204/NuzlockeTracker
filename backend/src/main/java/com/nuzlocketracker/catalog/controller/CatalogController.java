package com.nuzlocketracker.catalog.controller;

import com.nuzlocketracker.catalog.dto.GameResponse;
import com.nuzlocketracker.catalog.dto.PokemonSearchResponse;
import com.nuzlocketracker.catalog.dto.RouteResponse;
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
    public ResponseEntity<List<RouteResponse>> listRoutes(@PathVariable Long gameId) {
        return ResponseEntity.ok(catalogService.listRoutesByGame(gameId));
    }

    @GetMapping("/pokemon/search")
    public ResponseEntity<List<PokemonSearchResponse>> searchPokemon(
            @RequestParam String q,
            @RequestParam(defaultValue = "en") String lang
    ) {
        return ResponseEntity.ok(catalogService.searchPokemon(q, lang));
    }
}
