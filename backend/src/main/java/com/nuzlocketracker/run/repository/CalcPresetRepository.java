package com.nuzlocketracker.run.repository;

import com.nuzlocketracker.run.entity.CalcPreset;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface CalcPresetRepository extends JpaRepository<CalcPreset, Long> {
    List<CalcPreset> findByRunIdOrderByCreatedAtAsc(UUID runId);
    boolean existsByIdAndRunId(Long id, UUID runId);
}
