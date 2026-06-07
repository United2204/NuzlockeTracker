package com.nuzlocketracker.run.repository;

import com.nuzlocketracker.run.entity.RulePreset;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RulePresetRepository extends JpaRepository<RulePreset, Long> {
    Optional<RulePreset> findByNameAndSystemTrue(String name);
}
