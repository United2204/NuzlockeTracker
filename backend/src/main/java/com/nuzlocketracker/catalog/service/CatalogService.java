package com.nuzlocketracker.catalog.service;

import com.nuzlocketracker.catalog.dto.GameResponse;
import com.nuzlocketracker.catalog.dto.PokemonSearchResponse;
import com.nuzlocketracker.catalog.dto.RouteResponse;
import com.nuzlocketracker.catalog.repository.GameRepository;
import com.nuzlocketracker.catalog.repository.PokemonRepository;
import com.nuzlocketracker.catalog.repository.RouteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CatalogService {

    private final GameRepository gameRepository;
    private final RouteRepository routeRepository;
    private final PokemonRepository pokemonRepository;

    public List<GameResponse> listGames() {
        return gameRepository.findAllByOrderByGenerationAscNameAsc()
                .stream()
                .map(GameResponse::from)
                .toList();
    }

    public List<RouteResponse> listRoutesByGame(Long gameId) {
        return routeRepository.findByGameIdOrderByDisplayOrder(gameId)
                .stream()
                .map(RouteResponse::from)
                .toList();
    }

    public List<PokemonSearchResponse> searchPokemon(String query, String lang) {
        if (query == null || query.isBlank()) return List.of();
        String effectiveLang = (lang != null && !lang.isBlank()) ? lang : "en";
        return pokemonRepository.searchByName(query.trim(), effectiveLang);
    }
}
