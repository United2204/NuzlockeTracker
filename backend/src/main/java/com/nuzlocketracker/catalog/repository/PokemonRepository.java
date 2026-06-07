package com.nuzlocketracker.catalog.repository;

import com.nuzlocketracker.catalog.dto.PokemonSearchResponse;
import com.nuzlocketracker.catalog.entity.Pokemon;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface PokemonRepository extends JpaRepository<Pokemon, Long> {

    @Query("""
            SELECT new com.nuzlocketracker.catalog.dto.PokemonSearchResponse(
                p.id, p.speciesId,
                cast(p.nationalDexNumber as java.lang.Integer),
                p.types, p.spriteUrl, p.variant, pn.name
            )
            FROM Pokemon p
            JOIN PokemonName pn ON pn.pokemon = p AND pn.lang = :lang
            WHERE to_tsvector('simple', pn.name) @@ plainto_tsquery('simple', :query)
               OR lower(pn.name) LIKE lower(concat('%', :query, '%'))
            ORDER BY pn.name ASC
            LIMIT 20
            """)
    List<PokemonSearchResponse> searchByName(@Param("query") String query, @Param("lang") String lang);
}
