package com.nuzlocketracker.catalog.service;

import com.nuzlocketracker.catalog.dto.*;
import com.nuzlocketracker.catalog.entity.Route;
import com.nuzlocketracker.catalog.repository.BadgeRepository;
import com.nuzlocketracker.catalog.repository.GameRepository;
import com.nuzlocketracker.catalog.repository.PokemonRepository;
import com.nuzlocketracker.catalog.repository.RouteNameRepository;
import com.nuzlocketracker.catalog.repository.RouteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CatalogService {

    private final GameRepository gameRepository;
    private final RouteRepository routeRepository;
    private final RouteNameRepository routeNameRepository;
    private final PokemonRepository pokemonRepository;
    private final BadgeRepository badgeRepository;

    public List<GameResponse> listGames() {
        return gameRepository.findAllByOrderByGenerationAscNameAsc()
                .stream()
                .map(GameResponse::from)
                .toList();
    }

    public List<RouteResponse> listRoutesByGame(Long gameId) {
        return listRoutesByGame(gameId, "en");
    }

    public List<RouteResponse> listRoutesByGame(Long gameId, String lang) {
        List<Route> routes = routeRepository.findByGameIdOrderByDisplayOrder(gameId);
        Map<Long, String> localized = localizedRouteNames(routes, lang);
        return routes.stream()
                .map(r -> RouteResponse.from(r, localized.get(r.getId())))
                .toList();
    }

    private Map<Long, String> localizedRouteNames(List<Route> routes, String lang) {
        if (routes.isEmpty() || lang == null || lang.isBlank() || "en".equals(lang)) return Map.of();
        List<Long> ids = routes.stream().map(Route::getId).toList();
        return routeNameRepository.findNamesByRouteIdsAndLang(ids, lang).stream()
                .collect(Collectors.toMap(
                        RouteNameRepository.NameProjection::getRouteId,
                        RouteNameRepository.NameProjection::getName));
    }

    public List<BadgeResponse> getBadgesForGame(Long gameId) {
        return badgeRepository.findByGameIdOrderByDisplayOrderAsc(gameId)
                .stream()
                .map(BadgeResponse::from)
                .toList();
    }

    public List<EncounterSuggestionResponse> getEncounterSuggestions(Long routeId, String gameVersion) {
        return routeRepository.findEncounterSuggestions(routeId, gameVersion)
                .stream()
                .map(EncounterSuggestionResponse::from)
                .toList();
    }

    public List<PokemonSearchResponse> searchPokemon(String query, String lang) {
        if (query == null || query.isBlank()) return List.of();
        String effectiveLang = (lang != null && !lang.isBlank()) ? lang : "en";
        return pokemonRepository.searchByName(query.trim(), effectiveLang)
                .stream()
                .map(PokemonSearchResponse::from)
                .toList();
    }

    public List<PokemonSearchResponse> getEvolutionChain(Long pokemonId, String lang) {
        String effectiveLang = (lang != null && !lang.isBlank()) ? lang : "en";
        return pokemonRepository.findDirectEvolutions(pokemonId, effectiveLang)
                .stream()
                .map(PokemonSearchResponse::from)
                .toList();
    }
}
