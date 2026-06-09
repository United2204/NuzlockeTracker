package com.nuzlocketracker.catalog.repository;

import com.nuzlocketracker.catalog.entity.Pokemon;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface PokemonRepository extends JpaRepository<Pokemon, Long> {

    Optional<Pokemon> findByNationalDexNumber(Short nationalDexNumber);

    @Query(value = """
            SELECT p.id,
                   p.species_id          AS "speciesId",
                   p.national_dex_number AS "nationalDexNumber",
                   p.types::text         AS "typesJson",
                   p.sprite_url          AS "spriteUrl",
                   p.variant,
                   pn.name,
                   pec.chain_id          AS "chainId"
            FROM pokemon p
            JOIN pokemon_name pn ON pn.pokemon_id = p.id AND pn.lang = :lang
            LEFT JOIN pokemon_evolution_chain pec ON pec.pokemon_id = p.id
            WHERE to_tsvector('simple', pn.name) @@ plainto_tsquery('simple', :query)
               OR lower(pn.name) LIKE lower(concat('%', :query, '%'))
            ORDER BY pn.name ASC
            LIMIT 20
            """, nativeQuery = true)
    List<PokemonSearchProjection> searchByName(@Param("query") String query, @Param("lang") String lang);

    @Query(value = """
            SELECT p.id,
                   p.species_id          AS "speciesId",
                   p.national_dex_number AS "nationalDexNumber",
                   p.types::text         AS "typesJson",
                   p.sprite_url          AS "spriteUrl",
                   p.variant,
                   pn.name,
                   pec.chain_id          AS "chainId"
            FROM pokemon p
            JOIN pokemon_name pn ON pn.pokemon_id = p.id AND pn.lang = :lang
            LEFT JOIN pokemon_evolution_chain pec ON pec.pokemon_id = p.id
            WHERE p.evolves_from_pokemon_id = :pokemonId
            ORDER BY p.national_dex_number ASC NULLS LAST
            """, nativeQuery = true)
    List<PokemonSearchProjection> findDirectEvolutions(@Param("pokemonId") Long pokemonId, @Param("lang") String lang);

    @Query(value = "SELECT chain_id FROM pokemon_evolution_chain WHERE pokemon_id = :pokemonId", nativeQuery = true)
    Optional<Long> findChainId(@Param("pokemonId") Long pokemonId);

    @Query("SELECT COUNT(p) FROM Pokemon p WHERE p.evolvesFromPokemonId IS NOT NULL")
    long countWithEvolvesFrom();
}
