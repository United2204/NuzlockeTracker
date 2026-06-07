package com.nuzlocketracker.run.repository;

import com.nuzlocketracker.run.entity.RunStatOverride;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface RunStatOverrideRepository extends JpaRepository<RunStatOverride, Long> {
    List<RunStatOverride> findByRunId(UUID runId);
    Optional<RunStatOverride> findByRunIdAndPokemonId(UUID runId, Long pokemonId);
    void deleteByRunIdAndPokemonId(UUID runId, Long pokemonId);
}
