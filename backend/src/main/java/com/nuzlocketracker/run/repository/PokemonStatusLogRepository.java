package com.nuzlocketracker.run.repository;

import com.nuzlocketracker.run.entity.PokemonStatusLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface PokemonStatusLogRepository extends JpaRepository<PokemonStatusLog, Long> {

    List<PokemonStatusLog> findAllByCaughtPokemonIdOrderByOccurredAtAsc(UUID caughtPokemonId);

    @Query("""
        SELECT psl FROM PokemonStatusLog psl
        JOIN FETCH psl.caughtPokemon cp
        WHERE cp.run.id = :runId AND psl.correction = false
        ORDER BY cp.id ASC, psl.occurredAt ASC
    """)
    List<PokemonStatusLog> findByRunIdExcludingCorrections(@Param("runId") UUID runId);
}
