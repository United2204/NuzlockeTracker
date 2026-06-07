package com.nuzlocketracker.run.repository;

import com.nuzlocketracker.run.entity.PokemonStatusLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface PokemonStatusLogRepository extends JpaRepository<PokemonStatusLog, Long> {
    List<PokemonStatusLog> findAllByCaughtPokemonIdOrderByOccurredAtAsc(UUID caughtPokemonId);
}
