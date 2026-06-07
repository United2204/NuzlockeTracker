package com.nuzlocketracker.catalog.repository;

import com.nuzlocketracker.catalog.entity.PokemonBaseStats;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PokemonBaseStatsRepository extends JpaRepository<PokemonBaseStats, Long> {
}
