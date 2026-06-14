package com.nuzlocketracker.catalog.service;

import com.nuzlocketracker.catalog.dto.*;
import com.nuzlocketracker.catalog.entity.Pokemon;
import com.nuzlocketracker.catalog.entity.PokemonBaseStats;
import com.nuzlocketracker.catalog.entity.Route;
import com.nuzlocketracker.catalog.repository.BadgeNameRepository;
import com.nuzlocketracker.catalog.repository.BadgeRepository;
import com.nuzlocketracker.catalog.repository.GameRepository;
import com.nuzlocketracker.catalog.repository.PokemonAbilityRepository;
import com.nuzlocketracker.catalog.repository.PokemonBaseStatsRepository;
import com.nuzlocketracker.catalog.repository.PokemonNameRepository;
import com.nuzlocketracker.catalog.repository.PokemonRepository;
import com.nuzlocketracker.catalog.repository.RouteNameRepository;
import com.nuzlocketracker.catalog.repository.RouteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

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
    private final BadgeNameRepository badgeNameRepository;
    private final PokemonRepository pokemonRepository;
    private final BadgeRepository badgeRepository;
    private final PokemonNameRepository pokemonNameRepository;
    private final PokemonBaseStatsRepository pokemonBaseStatsRepository;
    private final PokemonAbilityRepository pokemonAbilityRepository;

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
        Map<Long, String> localizedRoutes = localizedRouteNames(routes, lang);
        Map<Long, String> localizedBadges = localizedBadgeNamesForRoutes(routes, lang);
        return routes.stream()
                .map(r -> RouteResponse.from(r, localizedRoutes.get(r.getId()),
                        r.getRequiredBadge() != null ? localizedBadges.get(r.getRequiredBadge().getId()) : null))
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

    private Map<Long, String> localizedBadgeNamesForRoutes(List<Route> routes, String lang) {
        if (routes.isEmpty() || lang == null || lang.isBlank() || "en".equals(lang)) return Map.of();
        List<Long> badgeIds = routes.stream()
                .filter(r -> r.getRequiredBadge() != null)
                .map(r -> r.getRequiredBadge().getId())
                .distinct().toList();
        if (badgeIds.isEmpty()) return Map.of();
        return badgeNameRepository.findNamesByBadgeIdsAndLang(badgeIds, lang).stream()
                .collect(Collectors.toMap(
                        BadgeNameRepository.NameProjection::getBadgeId,
                        BadgeNameRepository.NameProjection::getName));
    }

    public List<BadgeResponse> getBadgesForGame(Long gameId) {
        return getBadgesForGame(gameId, "en");
    }

    public List<BadgeResponse> getBadgesForGame(Long gameId, String lang) {
        List<com.nuzlocketracker.catalog.entity.Badge> badges =
                badgeRepository.findByGameIdOrderByDisplayOrderAsc(gameId);
        Map<Long, String> localized = localizedBadgeNames(badges, lang);
        return badges.stream()
                .map(b -> BadgeResponse.from(b, localized.get(b.getId())))
                .toList();
    }

    private Map<Long, String> localizedBadgeNames(List<com.nuzlocketracker.catalog.entity.Badge> badges, String lang) {
        if (badges.isEmpty() || lang == null || lang.isBlank() || "en".equals(lang)) return Map.of();
        List<Long> ids = badges.stream().map(com.nuzlocketracker.catalog.entity.Badge::getId).toList();
        return badgeNameRepository.findNamesByBadgeIdsAndLang(ids, lang).stream()
                .collect(Collectors.toMap(
                        BadgeNameRepository.NameProjection::getBadgeId,
                        BadgeNameRepository.NameProjection::getName));
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

    public PokemonDetailResponse getPokemonDetail(Long id, String lang) {
        Pokemon pokemon = pokemonRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Pokemon not found"));
        String effectiveLang = (lang != null && !lang.isBlank()) ? lang : "en";
        List<PokemonNameRepository.NameProjection> nameProjs =
                pokemonNameRepository.findNamesByPokemonIdsAndLang(List.of(id), effectiveLang);
        String name = nameProjs.isEmpty() ? "" : nameProjs.get(0).getName();
        PokemonBaseStats stats = pokemonBaseStatsRepository.findById(id).orElse(null);
        List<PokemonAbilityRepository.AbilityEntryProjection> abilities =
                pokemonAbilityRepository.findByPokemonId(id, effectiveLang);
        return PokemonDetailResponse.from(pokemon, name, stats, abilities);
    }
}
