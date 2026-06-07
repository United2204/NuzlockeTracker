package com.nuzlocketracker.run.repository;

import com.nuzlocketracker.run.entity.CaughtPokemon;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CaughtPokemonRepository extends JpaRepository<CaughtPokemon, UUID> {

    List<CaughtPokemon> findAllByRunIdAndStatus(UUID runId, CaughtPokemon.Status status);

    List<CaughtPokemon> findAllByRunId(UUID runId);

    Optional<CaughtPokemon> findByRouteEncounterId(UUID routeEncounterId);

    @Query("SELECT COUNT(cp) FROM CaughtPokemon cp WHERE cp.run.id = :runId AND cp.status = :status")
    long countByRunIdAndStatus(@Param("runId") UUID runId, @Param("status") CaughtPokemon.Status status);
}
