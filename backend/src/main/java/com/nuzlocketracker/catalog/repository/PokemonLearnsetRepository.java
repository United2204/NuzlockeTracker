package com.nuzlocketracker.catalog.repository;

import com.nuzlocketracker.catalog.entity.PokemonLearnset;
import com.nuzlocketracker.catalog.entity.PokemonLearnsetId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface PokemonLearnsetRepository extends JpaRepository<PokemonLearnset, PokemonLearnsetId> {

    @Query(value = """
            SELECT pl.move_id       AS "moveId",
                   mn.name,
                   m.type,
                   m.category,
                   m.power,
                   m.accuracy,
                   m.priority,
                   pl.learn_method  AS "learnMethod",
                   pl.level_learned AS "levelLearned"
            FROM pokemon_learnset pl
            JOIN move m ON m.id = pl.move_id
            LEFT JOIN move_name mn ON mn.move_id = m.id AND mn.lang = :lang
            WHERE pl.pokemon_id = :pokemonId
              AND (pl.game_id IS NULL OR pl.game_id = :gameId)
            ORDER BY pl.learn_method, pl.level_learned NULLS LAST, mn.name
            """, nativeQuery = true)
    List<LearnsetEntryProjection> findByPokemonIdAndGame(
            @Param("pokemonId") Long pokemonId,
            @Param("gameId") Long gameId,
            @Param("lang") String lang
    );

    @Query(value = """
            SELECT pl.move_id       AS "moveId",
                   mn.name,
                   m.type,
                   m.category,
                   m.power,
                   m.accuracy,
                   m.priority,
                   pl.learn_method  AS "learnMethod",
                   pl.level_learned AS "levelLearned"
            FROM pokemon_learnset pl
            JOIN move m ON m.id = pl.move_id
            LEFT JOIN move_name mn ON mn.move_id = m.id AND mn.lang = :lang
            WHERE pl.pokemon_id = :pokemonId
              AND pl.game_id IS NULL
            ORDER BY pl.learn_method, pl.level_learned NULLS LAST, mn.name
            """, nativeQuery = true)
    List<LearnsetEntryProjection> findByPokemonId(
            @Param("pokemonId") Long pokemonId,
            @Param("lang") String lang
    );

    interface LearnsetEntryProjection {
        Long getMoveId();
        String getName();
        String getType();
        String getCategory();
        Short getPower();
        Short getAccuracy();
        Short getPriority();
        String getLearnMethod();
        Short getLevelLearned();
    }
}
