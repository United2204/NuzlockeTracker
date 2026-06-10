package com.nuzlocketracker.sync;

import com.nuzlocketracker.auth.entity.User;
import com.nuzlocketracker.auth.repository.UserRepository;
import com.nuzlocketracker.catalog.entity.Pokemon;
import com.nuzlocketracker.catalog.entity.Route;
import com.nuzlocketracker.catalog.repository.GameRepository;
import com.nuzlocketracker.catalog.repository.PokemonRepository;
import com.nuzlocketracker.catalog.repository.RouteRepository;
import com.nuzlocketracker.common.exception.ResourceNotFoundException;
import com.nuzlocketracker.run.entity.CaughtPokemon;
import com.nuzlocketracker.run.entity.RouteEncounter;
import com.nuzlocketracker.run.entity.Run;
import com.nuzlocketracker.run.entity.RunRule;
import com.nuzlocketracker.run.repository.CaughtPokemonRepository;
import com.nuzlocketracker.run.repository.RouteEncounterRepository;
import com.nuzlocketracker.run.repository.RunRepository;
import com.nuzlocketracker.run.repository.RunRuleRepository;
import com.nuzlocketracker.sync.dto.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SyncService {

    private final UserRepository          userRepository;
    private final GameRepository          gameRepository;
    private final RouteRepository         routeRepository;
    private final PokemonRepository       pokemonRepository;
    private final RunRepository            runRepository;
    private final RunRuleRepository        runRuleRepository;
    private final RouteEncounterRepository encounterRepository;
    private final CaughtPokemonRepository  caughtPokemonRepository;

    /**
     * Batch upsert (INSERT-only strategy): creates each entity if it doesn't exist.
     * Existing entities are skipped — the server version is authoritative.
     * Only processes entities that belong to the authenticated user.
     */
    @Transactional
    public BatchSyncResponse batchSync(UUID userId, BatchSyncRequest req) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));

        int runsCreated = 0, runsSkipped = 0;
        int encCreated  = 0, encSkipped  = 0;
        int cpCreated   = 0, cpSkipped   = 0;

        // ── Runs ────────────────────────────────────────────────────────────────
        for (SyncRunDto dto : req.runs()) {
            if (runRepository.existsById(dto.id())) {
                runsSkipped++;
                continue;
            }
            Run run = new Run();
            run.setId(dto.id());
            run.setUser(user);
            run.setGame(gameRepository.getReferenceById(dto.gameId()));
            run.setName(dto.name());
            run.setSlug(dto.slug());
            run.setGameVersion(dto.gameVersion());
            run.setRandomized(dto.randomized());
            run.setFavorite(dto.favorite());
            run.setArchived(dto.archived());
            run.setDisplayOrder(dto.displayOrder());

            if (dto.status() != null) {
                try { run.setStatus(Run.Status.valueOf(dto.status())); }
                catch (IllegalArgumentException ignored) {}
            }
            if (dto.visibility() != null) {
                try { run.setVisibility(Run.Visibility.valueOf(dto.visibility())); }
                catch (IllegalArgumentException ignored) {}
            }

            runRepository.save(run);

            if (dto.rules() != null) {
                for (SyncRuleDto ruleDto : dto.rules()) {
                    try {
                        RunRule rule = new RunRule();
                        rule.setRun(run);
                        rule.setRuleType(RunRule.RuleType.valueOf(ruleDto.ruleType()));
                        rule.setEnabled(ruleDto.enabled());
                        rule.setValue(ruleDto.value());
                        runRuleRepository.save(rule);
                    } catch (IllegalArgumentException ignored) {}
                }
            }

            runsCreated++;
        }

        // ── Encounters ──────────────────────────────────────────────────────────
        for (SyncEncounterDto dto : req.encounters()) {
            if (encounterRepository.existsById(dto.id())) {
                encSkipped++;
                continue;
            }
            // Skip if the parent run doesn't belong to this user
            Run run = runRepository.findById(dto.runId()).orElse(null);
            if (run == null || !run.getUser().getId().equals(userId)) {
                encSkipped++;
                continue;
            }
            Route route = routeRepository.findById(dto.routeId()).orElse(null);
            if (route == null) { encSkipped++; continue; }

            RouteEncounter enc = new RouteEncounter();
            enc.setId(dto.id());
            enc.setRun(run);
            enc.setRoute(route);
            enc.setNotes(dto.notes());
            enc.setEncounteredAt(dto.encounteredAt());
            try {
                enc.setOutcome(RouteEncounter.Outcome.valueOf(dto.outcome()));
            } catch (IllegalArgumentException ignored) {}

            encounterRepository.save(enc);
            encCreated++;
        }

        // ── Caught Pokémon ──────────────────────────────────────────────────────
        for (SyncCaughtPokemonDto dto : req.caughtPokemon()) {
            if (caughtPokemonRepository.existsById(dto.id())) {
                cpSkipped++;
                continue;
            }
            Run run = runRepository.findById(dto.runId()).orElse(null);
            if (run == null || !run.getUser().getId().equals(userId)) {
                cpSkipped++;
                continue;
            }
            RouteEncounter enc = encounterRepository.findById(dto.routeEncounterId()).orElse(null);
            if (enc == null) { cpSkipped++; continue; }

            Pokemon original = pokemonRepository.findById(dto.originalPokemonId()).orElse(null);
            Pokemon current  = pokemonRepository.findById(dto.currentPokemonId()).orElse(null);
            if (original == null || current == null) { cpSkipped++; continue; }

            CaughtPokemon cp = new CaughtPokemon();
            cp.setId(dto.id());
            cp.setRun(run);
            cp.setRouteEncounter(enc);
            cp.setOriginalPokemon(original);
            cp.setCurrentPokemon(current);
            cp.setNickname(dto.nickname());
            cp.setShiny(dto.shiny());
            try {
                cp.setStatus(CaughtPokemon.Status.valueOf(dto.status()));
            } catch (IllegalArgumentException ignored) {}

            caughtPokemonRepository.save(cp);
            cpCreated++;
        }

        return new BatchSyncResponse(
                runsCreated, runsSkipped,
                encCreated,  encSkipped,
                cpCreated,   cpSkipped
        );
    }
}
