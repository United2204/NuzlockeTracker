package com.nuzlocketracker.run.repository;

import com.nuzlocketracker.run.entity.RouteEncounter;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface RouteEncounterRepository extends JpaRepository<RouteEncounter, UUID> {

    List<RouteEncounter> findAllByRunIdAndDeletedAtIsNull(UUID runId);

    Optional<RouteEncounter> findByRunIdAndRouteIdAndDeletedAtIsNull(UUID runId, Long routeId);
}
