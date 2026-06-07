package com.nuzlocketracker.run.controller;

import com.nuzlocketracker.run.dto.*;
import com.nuzlocketracker.run.service.RunService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/runs")
@RequiredArgsConstructor
public class RunController {

    private final RunService runService;

    // ─── Runs ──────────────────────────────────────────────────────────────────

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public RunDetailResponse createRun(@Valid @RequestBody CreateRunRequest req, Authentication auth) {
        return runService.createRun(userId(auth), req);
    }

    @GetMapping
    public List<RunSummaryResponse> listRuns(Authentication auth) {
        return runService.listRuns(userId(auth));
    }

    @GetMapping("/{runId}")
    public RunDetailResponse getRun(@PathVariable UUID runId, Authentication auth) {
        return runService.getRun(userId(auth), runId);
    }

    @PatchMapping("/{runId}")
    public RunDetailResponse updateRun(@PathVariable UUID runId,
                                       @Valid @RequestBody UpdateRunRequest req,
                                       Authentication auth) {
        return runService.updateRun(userId(auth), runId, req);
    }

    @DeleteMapping("/{runId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteRun(@PathVariable UUID runId, Authentication auth) {
        runService.deleteRun(userId(auth), runId);
    }

    // ─── Rutas ─────────────────────────────────────────────────────────────────

    @GetMapping("/{runId}/routes")
    public List<RouteWithEncounterResponse> getRoutes(@PathVariable UUID runId, Authentication auth) {
        return runService.getRoutes(userId(auth), runId);
    }

    // ─── Encuentros ────────────────────────────────────────────────────────────

    @PostMapping("/{runId}/encounters")
    @ResponseStatus(HttpStatus.CREATED)
    public RouteEncounterResponse recordEncounter(@PathVariable UUID runId,
                                                   @Valid @RequestBody RecordEncounterRequest req,
                                                   Authentication auth) {
        return runService.recordEncounter(userId(auth), runId, req);
    }

    // ─── Equipo y caja ─────────────────────────────────────────────────────────

    @GetMapping("/{runId}/team")
    public List<CaughtPokemonResponse> getTeam(@PathVariable UUID runId, Authentication auth) {
        return runService.getTeam(userId(auth), runId);
    }

    @GetMapping("/{runId}/graveyard")
    public List<CaughtPokemonResponse> getGraveyard(@PathVariable UUID runId, Authentication auth) {
        return runService.getGraveyard(userId(auth), runId);
    }

    @GetMapping("/{runId}/box")
    public List<CaughtPokemonResponse> getBox(@PathVariable UUID runId, Authentication auth) {
        return runService.getBox(userId(auth), runId);
    }

    // ─── Estado del Pokémon ────────────────────────────────────────────────────

    @PatchMapping("/{runId}/pokemon/{pokemonId}/status")
    public CaughtPokemonResponse updatePokemonStatus(@PathVariable UUID runId,
                                                      @PathVariable UUID pokemonId,
                                                      @Valid @RequestBody UpdatePokemonStatusRequest req,
                                                      Authentication auth) {
        return runService.updatePokemonStatus(userId(auth), runId, pokemonId, req);
    }

    @PatchMapping("/{runId}/pokemon/{pokemonId}/evolve")
    public CaughtPokemonResponse evolvePokemon(@PathVariable UUID runId,
                                                @PathVariable UUID pokemonId,
                                                @Valid @RequestBody EvolvePokemonRequest req,
                                                Authentication auth) {
        return runService.evolvePokemon(userId(auth), runId, pokemonId, req);
    }

    // ─── Medallas ──────────────────────────────────────────────────────────────

    @PostMapping("/{runId}/badges")
    @ResponseStatus(HttpStatus.CREATED)
    public RunBadgeResponse obtainBadge(@PathVariable UUID runId,
                                         @Valid @RequestBody ObtainBadgeRequest req,
                                         Authentication auth) {
        return runService.obtainBadge(userId(auth), runId, req);
    }

    @GetMapping("/{runId}/badges")
    public List<RunBadgeResponse> getBadges(@PathVariable UUID runId, Authentication auth) {
        return runService.getBadges(userId(auth), runId);
    }

    // ─── Helpers ───────────────────────────────────────────────────────────────

    private UUID userId(Authentication auth) {
        return UUID.fromString(auth.getName());
    }
}
