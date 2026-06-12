package com.nuzlocketracker.catalog.repository;

import com.nuzlocketracker.catalog.entity.PokemonName;
import com.nuzlocketracker.catalog.entity.PokemonNameId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface PokemonNameRepository extends JpaRepository<PokemonName, PokemonNameId> {

    @Query("SELECT n.name FROM PokemonName n WHERE n.pokemon.id = :pokemonId AND n.lang = :lang")
    Optional<String> findNameByPokemonIdAndLang(@Param("pokemonId") Long pokemonId, @Param("lang") String lang);

    @Query("""
        SELECT n.pokemon.id AS pokemonId, n.name AS name
        FROM PokemonName n
        WHERE n.pokemon.id IN :pokemonIds AND n.lang = :lang
    """)
    List<NameProjection> findNamesByPokemonIdsAndLang(@Param("pokemonIds") Collection<Long> pokemonIds,
                                                      @Param("lang") String lang);

    interface NameProjection {
        Long getPokemonId();
        String getName();
    }
}
