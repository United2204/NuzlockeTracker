package com.nuzlocketracker.stats;

import com.nuzlocketracker.catalog.entity.Pokemon;
import com.nuzlocketracker.catalog.repository.PokemonNameRepository;
import com.nuzlocketracker.catalog.repository.PokemonRepository;
import com.nuzlocketracker.common.exception.ResourceNotFoundException;
import com.nuzlocketracker.run.entity.CaughtPokemon;
import com.nuzlocketracker.run.entity.PokemonStatusLog;
import com.nuzlocketracker.run.entity.RouteEncounter;
import com.nuzlocketracker.run.entity.Run;
import com.nuzlocketracker.run.repository.*;
import com.nuzlocketracker.stats.dto.RunStatsResponse;
import com.nuzlocketracker.stats.dto.UserStatsResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.OffsetDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class StatsService {

    private final RunRepository runRepository;
    private final RouteEncounterRepository routeEncounterRepository;
    private final CaughtPokemonRepository caughtPokemonRepository;
    private final PokemonStatusLogRepository pokemonStatusLogRepository;
    private final PokemonRepository pokemonRepository;
    private final PokemonNameRepository pokemonNameRepository;

    public RunStatsResponse getRunStats(UUID runId, UUID userId) {
        Run run = runRepository.findByIdAndDeletedAtIsNull(runId)
                .orElseThrow(() -> new ResourceNotFoundException("Run", runId));
        if (!run.getUser().getId().equals(userId)) {
            throw new ResourceNotFoundException("Run", runId);
        }

        // Route counts
        int routesCaptured = (int) routeEncounterRepository.countByRunIdAndOutcome(
                runId, RouteEncounter.Outcome.CAPTURED);
        int routesFailed = (int) routeEncounterRepository.countByRunIdAndOutcomeIn(runId,
                List.of(RouteEncounter.Outcome.FAILED,
                        RouteEncounter.Outcome.DIED_IN_ENCOUNTER,
                        RouteEncounter.Outcome.NOT_FOUND));
        int routesAttempted = routesCaptured + routesFailed;
        int routesPending = (int) routeEncounterRepository.countByRunIdAndOutcomeIn(runId,
                List.of(RouteEncounter.Outcome.PENDING, RouteEncounter.Outcome.DEFERRED));

        // Pokémon status counts
        int activeCount  = (int) caughtPokemonRepository.countByRunIdAndStatus(runId, CaughtPokemon.Status.ACTIVE);
        int boxedCount   = (int) caughtPokemonRepository.countByRunIdAndStatus(runId, CaughtPokemon.Status.BOXED);
        int faintedCount = (int) caughtPokemonRepository.countByRunIdAndStatus(runId, CaughtPokemon.Status.FAINTED);

        // All caught Pokémon for this run
        List<CaughtPokemon> allPokemon = caughtPokemonRepository.findAllByRunId(runId);

        // All status logs grouped by caughtPokemonId
        Map<UUID, List<PokemonStatusLog>> logsByCp = pokemonStatusLogRepository
                .findByRunIdExcludingCorrections(runId)
                .stream()
                .collect(Collectors.groupingBy(log -> log.getCaughtPokemon().getId()));

        OffsetDateTime now = OffsetDateTime.now();

        // Time in team per Pokémon (sorted longest first)
        List<RunStatsResponse.PokemonTimeRecord> teamTime = allPokemon.stream()
                .map(cp -> {
                    String name = resolveName(cp.getCurrentPokemon().getId());
                    List<PokemonStatusLog> logs = logsByCp.getOrDefault(cp.getId(), List.of());
                    long seconds = computeSecondsInTeam(logs, now);
                    return new RunStatsResponse.PokemonTimeRecord(
                            cp.getId().toString(),
                            name,
                            cp.getNickname(),
                            cp.getCurrentPokemon().getSpriteUrl(),
                            seconds,
                            cp.getStatus().name()
                    );
                })
                .sorted(Comparator.comparingLong(RunStatsResponse.PokemonTimeRecord::secondsInTeam).reversed())
                .toList();

        // Deaths with notes
        List<RunStatsResponse.DeathRecord> deaths = allPokemon.stream()
                .filter(cp -> cp.getStatus() == CaughtPokemon.Status.FAINTED)
                .map(cp -> {
                    String name = resolveName(cp.getCurrentPokemon().getId());
                    List<PokemonStatusLog> logs = logsByCp.getOrDefault(cp.getId(), List.of());
                    PokemonStatusLog deathLog = logs.stream()
                            .filter(l -> l.getStatus() == CaughtPokemon.Status.FAINTED)
                            .reduce((first, second) -> second)
                            .orElse(null);
                    return new RunStatsResponse.DeathRecord(
                            cp.getId().toString(),
                            name,
                            cp.getNickname(),
                            cp.getCurrentPokemon().getSpriteUrl(),
                            deathLog != null ? deathLog.getNotes() : null,
                            deathLog != null ? deathLog.getOccurredAt().toString() : null
                    );
                })
                .toList();

        return new RunStatsResponse(
                routesAttempted, routesCaptured, routesFailed, routesPending,
                activeCount, boxedCount, faintedCount,
                deaths, teamTime
        );
    }

    public UserStatsResponse getUserStats(UUID userId) {
        int totalRuns     = (int) runRepository.countByUserId(userId);
        int activeRuns    = (int) runRepository.countByUserIdAndStatus(userId, Run.Status.ACTIVE);
        int completedRuns = (int) runRepository.countByUserIdAndStatus(userId, Run.Status.COMPLETED);
        int gameOverRuns  = (int) runRepository.countByUserIdAndStatus(userId, Run.Status.GAME_OVER);
        int abandonedRuns = (int) runRepository.countByUserIdAndStatus(userId, Run.Status.ABANDONED);

        int totalCaptures = (int) caughtPokemonRepository.countByUserId(userId);
        int totalDeaths   = (int) caughtPokemonRepository.countByUserIdAndStatus(userId, CaughtPokemon.Status.FAINTED);

        List<UserStatsResponse.MostCaughtEntry> mostCaught = caughtPokemonRepository
                .findMostCaughtByUserId(userId)
                .stream()
                .map(p -> {
                    long pokemonId = p.getPokemonId();
                    String name = resolveName(pokemonId);
                    String spriteUrl = pokemonRepository.findById(pokemonId)
                            .map(Pokemon::getSpriteUrl)
                            .orElse(null);
                    return new UserStatsResponse.MostCaughtEntry(
                            pokemonId, name, spriteUrl, p.getCaptureCount().intValue()
                    );
                })
                .toList();

        return new UserStatsResponse(
                totalRuns, activeRuns, completedRuns, gameOverRuns, abandonedRuns,
                totalCaptures, totalDeaths, mostCaught
        );
    }

    private long computeSecondsInTeam(List<PokemonStatusLog> logs, OffsetDateTime now) {
        long total = 0;
        for (int i = 0; i < logs.size(); i++) {
            if (logs.get(i).getStatus() == CaughtPokemon.Status.ACTIVE) {
                OffsetDateTime start = logs.get(i).getOccurredAt();
                OffsetDateTime end = i + 1 < logs.size() ? logs.get(i + 1).getOccurredAt() : now;
                long secs = Duration.between(start, end).toSeconds();
                if (secs > 0) total += secs;
            }
        }
        return total;
    }

    private String resolveName(Long pokemonId) {
        return pokemonNameRepository.findNameByPokemonIdAndLang(pokemonId, "en")
                .orElse("Unknown");
    }
}
