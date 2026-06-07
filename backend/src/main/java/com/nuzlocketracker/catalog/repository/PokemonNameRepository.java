package com.nuzlocketracker.catalog.repository;

import com.nuzlocketracker.catalog.entity.PokemonName;
import com.nuzlocketracker.catalog.entity.PokemonNameId;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PokemonNameRepository extends JpaRepository<PokemonName, PokemonNameId> {
}
