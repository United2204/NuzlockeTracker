package com.nuzlocketracker.run.repository;

import com.nuzlocketracker.run.entity.RouteEncounter;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface RouteEncounterRepository extends JpaRepository<RouteEncounter, UUID> {

    List<RouteEncounter> findAllByRunIdAndDeletedAtIsNull(UUID runId);

    Optional<RouteEncounter> findByRunIdAndRouteIdAndDeletedAtIsNull(UUID runId, Long routeId);

    List<RouteEncounter> findAllByRunIdAndRouteIdAndDeletedAtIsNullOrderByCreatedAtAsc(UUID runId, Long routeId);

    @Query("SELECT COUNT(re) FROM RouteEncounter re WHERE re.run.id = :runId AND re.outcome = :outcome AND re.deletedAt IS NULL")
    long countByRunIdAndOutcome(@Param("runId") UUID runId, @Param("outcome") RouteEncounter.Outcome outcome);

    @Query("SELECT COUNT(re) FROM RouteEncounter re WHERE re.run.id = :runId AND re.outcome IN :outcomes AND re.deletedAt IS NULL")
    long countByRunIdAndOutcomeIn(@Param("runId") UUID runId, @Param("outcomes") List<RouteEncounter.Outcome> outcomes);
}
