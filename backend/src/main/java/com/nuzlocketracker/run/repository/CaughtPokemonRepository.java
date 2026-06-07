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

    @Query("SELECT COUNT(cp) FROM CaughtPokemon cp WHERE cp.run.user.id = :userId")
    long countByUserId(@Param("userId") UUID userId);

    @Query("SELECT COUNT(cp) FROM CaughtPokemon cp WHERE cp.run.user.id = :userId AND cp.status = :status")
    long countByUserIdAndStatus(@Param("userId") UUID userId, @Param("status") CaughtPokemon.Status status);

    @Query(value = """
        SELECT cp.original_pokemon_id AS "pokemonId", COUNT(*) AS "captureCount"
        FROM caught_pokemon cp
        JOIN run r ON r.id = cp.run_id
        WHERE r.user_id = :userId AND r.deleted_at IS NULL
        GROUP BY cp.original_pokemon_id
        ORDER BY COUNT(*) DESC
        LIMIT 10
    """, nativeQuery = true)
    List<MostCaughtProjection> findMostCaughtByUserId(@Param("userId") UUID userId);

    interface MostCaughtProjection {
        Long getPokemonId();
        Long getCaptureCount();
    }
}
