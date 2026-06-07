package com.nuzlocketracker.catalog.repository;

import com.nuzlocketracker.catalog.entity.Pokemon;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface PokemonRepository extends JpaRepository<Pokemon, Long> {

    @Query(value = """
            SELECT p.id,
                   p.species_id         AS "speciesId",
                   p.national_dex_number AS "nationalDexNumber",
                   p.types::text        AS "typesJson",
                   p.sprite_url         AS "spriteUrl",
                   p.variant,
                   pn.name
            FROM pokemon p
            JOIN pokemon_name pn ON pn.pokemon_id = p.id AND pn.lang = :lang
            WHERE to_tsvector('simple', pn.name) @@ plainto_tsquery('simple', :query)
               OR lower(pn.name) LIKE lower(concat('%', :query, '%'))
            ORDER BY pn.name ASC
            LIMIT 20
            """, nativeQuery = true)
    List<PokemonSearchProjection> searchByName(@Param("query") String query, @Param("lang") String lang);
}
