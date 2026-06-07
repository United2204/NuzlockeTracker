package com.nuzlocketracker.catalog.repository;

import com.nuzlocketracker.catalog.entity.Route;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface RouteRepository extends JpaRepository<Route, Long> {

    @Query("""
            SELECT r FROM Route r
            LEFT JOIN FETCH r.requiredBadge
            WHERE r.game.id = :gameId
            ORDER BY r.displayOrder ASC
            """)
    List<Route> findByGameIdOrderByDisplayOrder(@Param("gameId") Long gameId);

    @Query(value = """
            SELECT p.id,
                   pn.name,
                   p.types::text              AS "typesJson",
                   p.sprite_url               AS "spriteUrl",
                   p.variant,
                   ret.encounter_type         AS "encounterType",
                   ret.rarity,
                   ret.game_version           AS "gameVersion"
            FROM route_encounter_table ret
            JOIN pokemon p  ON p.id  = ret.pokemon_id
            JOIN pokemon_name pn ON pn.pokemon_id = p.id AND pn.lang = 'en'
            WHERE ret.route_id = :routeId
              AND (CAST(:gameVersion AS TEXT) IS NULL
                   OR ret.game_version IS NULL
                   OR ret.game_version = CAST(:gameVersion AS TEXT))
            ORDER BY ret.rarity DESC NULLS LAST
            """, nativeQuery = true)
    List<EncounterSuggestionProjection> findEncounterSuggestions(
            @Param("routeId") Long routeId,
            @Param("gameVersion") String gameVersion);
}
