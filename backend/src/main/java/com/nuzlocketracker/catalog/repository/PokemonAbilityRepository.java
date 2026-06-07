package com.nuzlocketracker.catalog.repository;

import com.nuzlocketracker.catalog.entity.PokemonAbility;
import com.nuzlocketracker.catalog.entity.PokemonAbilityId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface PokemonAbilityRepository extends JpaRepository<PokemonAbility, PokemonAbilityId> {

    @Query(value = """
            SELECT pa.ability_id AS "abilityId",
                   an.name,
                   pa.slot
            FROM pokemon_ability pa
            LEFT JOIN ability_name an ON an.ability_id = pa.ability_id AND an.lang = :lang
            WHERE pa.pokemon_id = :pokemonId
            ORDER BY pa.slot
            """, nativeQuery = true)
    List<AbilityEntryProjection> findByPokemonId(
            @Param("pokemonId") Long pokemonId,
            @Param("lang") String lang
    );

    interface AbilityEntryProjection {
        Long getAbilityId();
        String getName();
        String getSlot();
    }
}
