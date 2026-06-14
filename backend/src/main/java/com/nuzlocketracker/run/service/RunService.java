package com.nuzlocketracker.run.service;

import com.nuzlocketracker.auth.entity.User;
import com.nuzlocketracker.catalog.entity.Badge;
import com.nuzlocketracker.catalog.entity.Game;
import com.nuzlocketracker.catalog.entity.Pokemon;
import com.nuzlocketracker.catalog.entity.Route;
import com.nuzlocketracker.catalog.entity.Gym;
import com.nuzlocketracker.catalog.repository.BadgeRepository;
import com.nuzlocketracker.catalog.repository.GameRepository;
import com.nuzlocketracker.catalog.repository.GymRepository;
import com.nuzlocketracker.catalog.repository.PokemonNameRepository;
import com.nuzlocketracker.catalog.repository.PokemonRepository;
import com.nuzlocketracker.catalog.repository.RouteNameRepository;
import com.nuzlocketracker.catalog.repository.RouteRepository;
import com.nuzlocketracker.common.exception.ConflictException;
import com.nuzlocketracker.common.exception.ResourceNotFoundException;
import com.nuzlocketracker.run.dto.*;
import com.nuzlocketracker.run.entity.*;
import com.nuzlocketracker.run.repository.*;
import com.nuzlocketracker.social.repository.UserFollowRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class RunService {

    private final RunRepository runRepository;
    private final RunRuleRepository runRuleRepository;
    private final RunBadgeRepository runBadgeRepository;
    private final RouteEncounterRepository routeEncounterRepository;
    private final CaughtPokemonRepository caughtPokemonRepository;
    private final PokemonStatusLogRepository pokemonStatusLogRepository;
    private final RunEventRepository runEventRepository;
    private final RulePresetRepository rulePresetRepository;
    private final GameRepository gameRepository;
    private final RouteRepository routeRepository;
    private final RouteNameRepository routeNameRepository;
    private final PokemonRepository pokemonRepository;
    private final PokemonNameRepository pokemonNameRepository;
    private final BadgeRepository badgeRepository;
    private final GymRepository gymRepository;
    private final UserFollowRepository userFollowRepository;
    private final ObjectMapper objectMapper;

    // ─── Runs ──────────────────────────────────────────────────────────────────

    public RunDetailResponse createRun(UUID userId, CreateRunRequest req) {
        Game game = gameRepository.findById(req.gameId())
                .orElseThrow(() -> new ResourceNotFoundException("Game", req.gameId()));

        RulePreset preset = resolvePreset(req.presetId());

        User userRef = new User();
        userRef.setId(userId);

        Run run = new Run();
        run.setUser(userRef);
        run.setGame(game);
        run.setName(req.name().trim());
        run.setSlug(generateSlug(userId, req.name().trim()));
        run.setGameVersion(req.gameVersion());
        run.setRandomized(req.randomized());
        run.setBasePreset(preset);

        if (req.visibility() != null) {
            try { run.setVisibility(Run.Visibility.valueOf(req.visibility())); }
            catch (IllegalArgumentException ignored) {}
        }

        run = runRepository.save(run);
        applyPresetRules(run, preset, req.rulesOverride());

        return buildDetail(run);
    }

    @Transactional(readOnly = true)
    public List<RunSummaryResponse> listRuns(UUID userId) {
        List<Run> runs = runRepository.findAllByUserId(userId);
        Map<UUID, Map<CaughtPokemon.Status, Long>> counts = countPokemonByStatus(runs);
        return runs.stream()
                .map(run -> {
                    Map<CaughtPokemon.Status, Long> byStatus = counts.getOrDefault(run.getId(), Map.of());
                    return RunSummaryResponse.from(
                            run,
                            byStatus.getOrDefault(CaughtPokemon.Status.ACTIVE, 0L),
                            byStatus.getOrDefault(CaughtPokemon.Status.FAINTED, 0L)
                    );
                })
                .toList();
    }

    @Transactional(readOnly = true)
    public RunDetailResponse getRun(UUID userId, UUID runId) {
        Run run = requireReadableRun(userId, runId);
        return buildDetail(run);
    }

    public RunDetailResponse updateRun(UUID userId, UUID runId, UpdateRunRequest req) {
        Run run = requireOwnedRun(userId, runId);

        if (req.name() != null && !req.name().isBlank()) {
            String newName = req.name().trim();
            if (!newName.equals(run.getName())) {
                run.setName(newName);
                run.setSlug(generateSlug(userId, newName));
            }
        }
        if (req.visibility() != null) {
            try { run.setVisibility(Run.Visibility.valueOf(req.visibility())); }
            catch (IllegalArgumentException ignored) {}
        }
        if (req.status() != null) {
            try {
                Run.Status newStatus = Run.Status.valueOf(req.status());
                if (newStatus == Run.Status.COMPLETED || newStatus == Run.Status.ABANDONED) {
                    run.setStatus(newStatus);
                    run.setEndedAt(OffsetDateTime.now());
                    emitEvent(run, RunEvent.EventType.RUN_ENDED,
                            "{\"status\":\"" + newStatus.name() + "\"}");
                }
            } catch (IllegalArgumentException ignored) {}
        }
        if (req.favorite() != null) run.setFavorite(req.favorite());
        if (req.archived() != null) run.setArchived(req.archived());
        if (req.displayOrder() != null) run.setDisplayOrder(req.displayOrder());

        run = runRepository.save(run);
        return buildDetail(run);
    }

    public void deleteRun(UUID userId, UUID runId) {
        Run run = requireOwnedRun(userId, runId);
        run.setDeletedAt(OffsetDateTime.now());
        runRepository.save(run);
    }

    public List<RunRuleResponse> updateRules(UUID userId, UUID runId, UpdateRulesRequest req) {
        requireOwnedRun(userId, runId);
        List<RunRule> existing = runRuleRepository.findAllByRunId(runId);
        Map<RunRule.RuleType, RunRule> byType = existing.stream()
                .collect(Collectors.toMap(RunRule::getRuleType, r -> r));

        for (UpdateRulesRequest.RuleOverride ov : req.rules()) {
            try {
                RunRule.RuleType type = RunRule.RuleType.valueOf(ov.ruleType());
                RunRule rule = byType.computeIfAbsent(type, t -> {
                    RunRule r = new RunRule();
                    r.setRun(runRepository.getReferenceById(runId));
                    r.setRuleType(t);
                    return r;
                });
                rule.setEnabled(ov.enabled());
                rule.setValue(ov.value());
            } catch (IllegalArgumentException ignored) {}
        }

        runRuleRepository.saveAll(byType.values());
        return byType.values().stream().map(RunRuleResponse::from).toList();
    }

    // ─── Rutas y encuentros ────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<RouteWithEncounterResponse> getRoutes(UUID userId, UUID runId) {
        return getRoutes(userId, runId, "en");
    }

    @Transactional(readOnly = true)
    public List<RouteWithEncounterResponse> getRoutes(UUID userId, UUID runId, String lang) {
        Run run = requireReadableRun(userId, runId);
        List<Route> routes = routeRepository.findByGameIdOrderByDisplayOrder(run.getGame().getId());

        Map<Long, String> localizedNames = localizedRouteNames(routes, lang);

        Map<Long, List<RouteEncounter>> encountersByRouteId = routeEncounterRepository
                .findAllByRunIdAndDeletedAtIsNull(runId).stream()
                .collect(Collectors.groupingBy(e -> e.getRoute().getId()));

        List<CaughtPokemon> caught = caughtPokemonRepository.findAllByRunId(runId);
        List<CaughtPokemonResponse> cpResponses = toCaughtPokemonResponses(caught);
        Map<UUID, CaughtPokemonResponse> cpByEncounterId = new HashMap<>();
        for (int i = 0; i < caught.size(); i++) {
            cpByEncounterId.put(caught.get(i).getRouteEncounter().getId(), cpResponses.get(i));
        }

        return routes.stream().map(route -> {
            List<RouteEncounter> encs = encountersByRouteId.getOrDefault(route.getId(), List.of());
            // orden cronológico por createdAt
            List<RouteEncounter> sorted = encs.stream()
                    .sorted(java.util.Comparator.comparing(RouteEncounter::getCreatedAt))
                    .toList();
            return RouteWithEncounterResponse.build(route, localizedNames.get(route.getId()), sorted, cpByEncounterId);
        }).toList();
    }

    @Transactional(readOnly = true)
    public List<GymCapResponse> getGymCaps(UUID userId, UUID runId) {
        Run run = requireReadableRun(userId, runId);
        List<Gym> gyms = gymRepository.findByGameIdOrderByDisplayOrderAsc(run.getGame().getId());
        if (gyms.isEmpty()) return List.of();

        int modifierPercent = 0;
        Optional<RunRule> levelCapRule = runRuleRepository.findByRunIdAndRuleType(runId, RunRule.RuleType.LEVEL_CAP);
        if (levelCapRule.isPresent() && levelCapRule.get().isEnabled()
                && levelCapRule.get().getValue() != null) {
            try {
                Map<String, Object> parsed = objectMapper.readValue(
                        levelCapRule.get().getValue(), new TypeReference<>() {});
                Object mod = parsed.get("modifierPercent");
                if (mod instanceof Number n) modifierPercent = n.intValue();
            } catch (Exception ignored) {}
        }

        double multiplier = 1.0 + modifierPercent / 100.0;
        return gyms.stream().map(gym -> new GymCapResponse(
                gym.getBadge().getId(),
                gym.getBadge().getName(),
                gym.getLeaderName(),
                gym.getAcePokemonLevel(),
                (int) Math.floor(gym.getAcePokemonLevel() * multiplier)
        )).toList();
    }

    private Map<Long, String> localizedRouteNames(List<Route> routes, String lang) {
        if (routes.isEmpty() || lang == null || lang.isBlank() || "en".equals(lang)) return Map.of();
        List<Long> ids = routes.stream().map(Route::getId).toList();
        return routeNameRepository.findNamesByRouteIdsAndLang(ids, lang).stream()
                .collect(Collectors.toMap(
                        RouteNameRepository.NameProjection::getRouteId,
                        RouteNameRepository.NameProjection::getName));
    }

    public RouteEncounterResponse recordEncounter(UUID userId, UUID runId, RecordEncounterRequest req) {
        Run run = requireOwnedRun(userId, runId);
        if (run.getStatus() != Run.Status.ACTIVE) {
            throw new IllegalArgumentException("Cannot modify a run that is not ACTIVE");
        }

        RouteEncounter.Outcome outcome;
        try {
            outcome = RouteEncounter.Outcome.valueOf(req.outcome());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid outcome: " + req.outcome());
        }

        if (outcome == RouteEncounter.Outcome.CAPTURED && req.pokemonId() == null) {
            throw new IllegalArgumentException("pokemonId is required when outcome is CAPTURED");
        }

        Route route = routeRepository.findById(req.routeId())
                .orElseThrow(() -> new ResourceNotFoundException("Route", req.routeId()));

        int maxCatches = resolveMaxCatches(runId);

        RouteEncounter encounter;
        if (req.encounterId() != null) {
            // editar slot específico
            encounter = routeEncounterRepository.findById(req.encounterId())
                    .orElseThrow(() -> new ResourceNotFoundException("RouteEncounter", req.encounterId()));
        } else {
            // buscar slot libre o crear uno nuevo
            List<RouteEncounter> existing = routeEncounterRepository
                    .findAllByRunIdAndRouteIdAndDeletedAtIsNullOrderByCreatedAtAsc(runId, req.routeId());

            encounter = existing.stream()
                    .filter(e -> e.getOutcome() == RouteEncounter.Outcome.PENDING
                              || e.getOutcome() == RouteEncounter.Outcome.DEFERRED)
                    .findFirst()
                    .orElseGet(() -> {
                        long used = existing.stream()
                                .filter(e -> e.getOutcome() != RouteEncounter.Outcome.PENDING
                                          && e.getOutcome() != RouteEncounter.Outcome.DEFERRED)
                                .count();
                        if (used >= maxCatches) {
                            throw new ConflictException("Límite de capturas por ruta alcanzado (" + maxCatches + ")");
                        }
                        RouteEncounter e = new RouteEncounter();
                        e.setRun(run);
                        e.setRoute(route);
                        return e;
                    });
        }

        Optional<CaughtPokemon> existingCp = encounter.getId() != null
                ? caughtPokemonRepository.findByRouteEncounterId(encounter.getId())
                : Optional.empty();

        encounter.setOutcome(outcome);
        encounter.setNotes(req.notes());
        if (outcome != RouteEncounter.Outcome.PENDING && outcome != RouteEncounter.Outcome.DEFERRED) {
            encounter.setEncounteredAt(OffsetDateTime.now());
        }
        encounter = routeEncounterRepository.save(encounter);

        CaughtPokemon caughtPokemon = null;

        if (outcome == RouteEncounter.Outcome.CAPTURED) {
            Pokemon pokemon = pokemonRepository.findById(req.pokemonId())
                    .orElseThrow(() -> new ResourceNotFoundException("Pokemon", req.pokemonId()));

            if (existingCp.isPresent()) {
                caughtPokemon = existingCp.get();
                caughtPokemon.setOriginalPokemon(pokemon);
                caughtPokemon.setCurrentPokemon(pokemon);
                caughtPokemon.setNickname(req.nickname());
                caughtPokemon.setShiny(req.shiny());
            } else {
                long activeCount = caughtPokemonRepository.countByRunIdAndStatus(run.getId(), CaughtPokemon.Status.ACTIVE);
                CaughtPokemon.Status initialStatus = activeCount >= 6
                        ? CaughtPokemon.Status.BOXED
                        : CaughtPokemon.Status.ACTIVE;

                caughtPokemon = new CaughtPokemon();
                caughtPokemon.setRun(run);
                caughtPokemon.setRouteEncounter(encounter);
                caughtPokemon.setOriginalPokemon(pokemon);
                caughtPokemon.setCurrentPokemon(pokemon);
                caughtPokemon.setNickname(req.nickname());
                caughtPokemon.setShiny(req.shiny());
                caughtPokemon.setStatus(initialStatus);
            }
            caughtPokemon = caughtPokemonRepository.save(caughtPokemon);

            if (existingCp.isEmpty()) {
                logStatus(caughtPokemon, caughtPokemon.getStatus(), null, false);
                String pokemonName = resolveName(pokemon.getId());
                emitEvent(run, RunEvent.EventType.POKEMON_CAPTURED,
                        "{\"pokemonId\":" + pokemon.getId()
                                + ",\"pokemonName\":\"" + pokemonName + "\""
                                + ",\"routeId\":" + route.getId()
                                + ",\"caughtPokemonId\":\"" + caughtPokemon.getId() + "\"}");
            }
        } else if (existingCp.isPresent()) {
            // El encuentro dejó de ser una captura (postergado, fallado, etc.).
            // El Pokémon ya no corresponde a este slot: lo eliminamos para liberar el slot
            // en lugar de mandarlo al cementerio. Los status logs se borran en cascada (FK ON DELETE CASCADE).
            caughtPokemonRepository.delete(existingCp.get());
        }

        touchRunActivity(run);
        CaughtPokemonResponse cpResp = caughtPokemon != null ? toCaughtPokemonResponse(caughtPokemon) : null;
        return RouteEncounterResponse.from(encounter, cpResp);
    }

    // ─── Pokémon capturados ────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<CaughtPokemonResponse> getTeam(UUID userId, UUID runId) {
        requireOwnedRun(userId, runId);
        return toCaughtPokemonResponses(
                caughtPokemonRepository.findAllByRunIdAndStatus(runId, CaughtPokemon.Status.ACTIVE));
    }

    @Transactional(readOnly = true)
    public List<CaughtPokemonResponse> getGraveyard(UUID userId, UUID runId) {
        requireOwnedRun(userId, runId);
        return toCaughtPokemonResponses(
                caughtPokemonRepository.findAllByRunIdAndStatus(runId, CaughtPokemon.Status.FAINTED));
    }

    @Transactional(readOnly = true)
    public List<CaughtPokemonResponse> getBox(UUID userId, UUID runId) {
        requireOwnedRun(userId, runId);
        return toCaughtPokemonResponses(
                caughtPokemonRepository.findAllByRunIdAndStatus(runId, CaughtPokemon.Status.BOXED));
    }

    public CaughtPokemonResponse updatePokemonStatus(UUID userId, UUID runId, UUID pokemonId,
                                                      UpdatePokemonStatusRequest req) {
        requireOwnedRun(userId, runId);
        CaughtPokemon cp = caughtPokemonRepository.findById(pokemonId)
                .filter(p -> p.getRun().getId().equals(runId))
                .orElseThrow(() -> new ResourceNotFoundException("CaughtPokemon", pokemonId));

        CaughtPokemon.Status newStatus;
        try {
            newStatus = CaughtPokemon.Status.valueOf(req.status());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid status: " + req.status());
        }

        cp.setStatus(newStatus);
        cp = caughtPokemonRepository.save(cp);
        logStatus(cp, newStatus, req.notes(), req.correction());

        Run run = cp.getRun();
        if (newStatus == CaughtPokemon.Status.ACTIVE && run.getStatus() == Run.Status.GAME_OVER) {
            run.setStatus(Run.Status.ACTIVE);
            run.setEndedAt(null);
            runRepository.save(run);
        }

        if (newStatus == CaughtPokemon.Status.FAINTED && !req.correction()) {
            String name = resolveName(cp.getCurrentPokemon().getId());
            emitEvent(run, RunEvent.EventType.POKEMON_FAINTED,
                    "{\"caughtPokemonId\":\"" + cp.getId() + "\""
                            + ",\"pokemonName\":\"" + name + "\""
                            + ",\"notes\":" + jsonStr(req.notes()) + "}");

            if (isPermadeathEnabled(run)) {
                long remaining = caughtPokemonRepository.countByRunIdAndStatus(runId, CaughtPokemon.Status.ACTIVE);
                if (remaining == 0) {
                    run.setStatus(Run.Status.GAME_OVER);
                    run.setEndedAt(OffsetDateTime.now());
                    emitEvent(run, RunEvent.EventType.RUN_ENDED, "{\"status\":\"GAME_OVER\"}");
                    runRepository.save(run);
                }
            }
        }

        touchRunActivity(run);
        return toCaughtPokemonResponse(cp);
    }

    public CaughtPokemonResponse evolvePokemon(UUID userId, UUID runId, UUID pokemonId,
                                                EvolvePokemonRequest req) {
        requireOwnedRun(userId, runId);
        CaughtPokemon cp = caughtPokemonRepository.findById(pokemonId)
                .filter(p -> p.getRun().getId().equals(runId))
                .orElseThrow(() -> new ResourceNotFoundException("CaughtPokemon", pokemonId));

        Pokemon target = pokemonRepository.findById(req.targetPokemonId())
                .orElseThrow(() -> new ResourceNotFoundException("Pokemon", req.targetPokemonId()));

        Long fromId = cp.getCurrentPokemon().getId();
        cp.setCurrentPokemon(target);
        cp = caughtPokemonRepository.save(cp);

        emitEvent(cp.getRun(), RunEvent.EventType.POKEMON_EVOLVED,
                "{\"caughtPokemonId\":\"" + cp.getId() + "\""
                        + ",\"fromPokemonId\":" + fromId
                        + ",\"toPokemonId\":" + target.getId()
                        + ",\"fromName\":\"" + resolveName(fromId) + "\""
                        + ",\"toName\":\"" + resolveName(target.getId()) + "\"}");

        touchRunActivity(cp.getRun());
        return toCaughtPokemonResponse(cp);
    }

    public CaughtPokemonResponse devolvePokemon(UUID userId, UUID runId, UUID pokemonId) {
        requireOwnedRun(userId, runId);
        CaughtPokemon cp = caughtPokemonRepository.findById(pokemonId)
                .filter(p -> p.getRun().getId().equals(runId))
                .orElseThrow(() -> new ResourceNotFoundException("CaughtPokemon", pokemonId));

        if (cp.getCurrentPokemon().getId().equals(cp.getOriginalPokemon().getId())) {
            return toCaughtPokemonResponse(cp);
        }

        cp.setCurrentPokemon(cp.getOriginalPokemon());
        cp = caughtPokemonRepository.save(cp);
        return toCaughtPokemonResponse(cp);
    }

    // ─── Medallas ──────────────────────────────────────────────────────────────

    public RunBadgeResponse obtainBadge(UUID userId, UUID runId, ObtainBadgeRequest req) {
        Run run = requireOwnedRun(userId, runId);

        Badge badge = badgeRepository.findById(req.badgeId())
                .orElseThrow(() -> new ResourceNotFoundException("Badge", req.badgeId()));

        List<Badge> allGameBadges = badgeRepository.findByGameIdOrderByDisplayOrderAsc(badge.getGame().getId());

        Set<Long> alreadyObtained = runBadgeRepository.findAllByRunIdOrderByObtainedAtAsc(runId)
                .stream().map(rb -> rb.getBadge().getId()).collect(Collectors.toSet());

        RunBadge primaryBadge = null;

        for (Badge b : allGameBadges) {
            if (b.getDisplayOrder() <= badge.getDisplayOrder() && !alreadyObtained.contains(b.getId())) {
                RunBadge rb = new RunBadge();
                rb.setRun(run);
                rb.setBadge(b);
                rb = runBadgeRepository.save(rb);
                if (b.getId().equals(badge.getId())) {
                    primaryBadge = rb;
                    emitEvent(run, RunEvent.EventType.BADGE_OBTAINED,
                            "{\"badgeId\":" + b.getId() + ",\"badgeName\":\"" + b.getName() + "\"}");
                }
            }
        }

        if (primaryBadge == null) {
            throw new ConflictException("Badge already obtained");
        }

        touchRunActivity(run);
        return RunBadgeResponse.from(primaryBadge);
    }

    public void removeBadge(UUID userId, UUID runId, long badgeId) {
        requireOwnedRun(userId, runId);
        runBadgeRepository.deleteByRunIdAndBadgeId(runId, badgeId);
    }

    @Transactional(readOnly = true)
    public List<RunBadgeResponse> getBadges(UUID userId, UUID runId) {
        requireOwnedRun(userId, runId);
        return runBadgeRepository.findAllByRunIdOrderByObtainedAtAsc(runId)
                .stream().map(RunBadgeResponse::from).toList();
    }

    // ─── Helpers ───────────────────────────────────────────────────────────────

    private Run requireReadableRun(UUID viewerId, UUID runId) {
        Run run = runRepository.findByIdAndDeletedAtIsNull(runId)
                .orElseThrow(() -> new ResourceNotFoundException("Run", runId));
        if (run.getUser().getId().equals(viewerId)) return run;
        return switch (run.getVisibility()) {
            case PUBLIC -> run;
            case FOLLOWERS_ONLY -> {
                if (userFollowRepository.existsByFollowerIdAndFollowedId(viewerId, run.getUser().getId()))
                    yield run;
                throw new ResourceNotFoundException("Run", runId);
            }
            case PRIVATE -> throw new ResourceNotFoundException("Run", runId);
        };
    }

    private Run requireOwnedRun(UUID userId, UUID runId) {
        Run run = runRepository.findByIdAndDeletedAtIsNull(runId)
                .orElseThrow(() -> new ResourceNotFoundException("Run", runId));
        if (!run.getUser().getId().equals(userId)) {
            throw new ResourceNotFoundException("Run", runId);
        }
        return run;
    }

    private RunDetailResponse buildDetail(Run run) {
        List<RunRuleResponse> rules = runRuleRepository.findAllByRunId(run.getId())
                .stream().map(RunRuleResponse::from).toList();
        List<RunBadgeResponse> badges = runBadgeRepository.findAllByRunIdOrderByObtainedAtAsc(run.getId())
                .stream().map(RunBadgeResponse::from).toList();
        long active = caughtPokemonRepository.countByRunIdAndStatus(run.getId(), CaughtPokemon.Status.ACTIVE);
        long fainted = caughtPokemonRepository.countByRunIdAndStatus(run.getId(), CaughtPokemon.Status.FAINTED);
        long boxed = caughtPokemonRepository.countByRunIdAndStatus(run.getId(), CaughtPokemon.Status.BOXED);
        return RunDetailResponse.from(run, rules, badges, active, fainted, boxed);
    }

    private void applyPresetRules(Run run, RulePreset preset,
                                   List<CreateRunRequest.RuleOverride> overrides) {
        String presetName = preset != null ? preset.getName() : "Clásico";
        boolean isHardcore = "Hardcore".equals(presetName);
        boolean isLibre    = "Libre".equals(presetName);

        Map<RunRule.RuleType, Boolean> enabled = new LinkedHashMap<>();
        enabled.put(RunRule.RuleType.FIRST_ENCOUNTER_ONLY,    !isLibre);
        enabled.put(RunRule.RuleType.PERMADEATH,              !isLibre);
        enabled.put(RunRule.RuleType.NICKNAME_REQUIRED,       false);   // siempre opcional
        enabled.put(RunRule.RuleType.SPECIES_CLAUSE,          !isLibre);
        enabled.put(RunRule.RuleType.DUPLICATE_CLAUSE,        false);
        enabled.put(RunRule.RuleType.ITEM_CLAUSE,             isHardcore);
        enabled.put(RunRule.RuleType.REGIONAL_VARIANT_CLAUSE, false);
        enabled.put(RunRule.RuleType.LEVEL_CAP,               isHardcore);
        enabled.put(RunRule.RuleType.MAX_CATCHES_PER_ROUTE,   false);

        Map<RunRule.RuleType, String> values = new HashMap<>();
        if (isHardcore) values.put(RunRule.RuleType.LEVEL_CAP, "{\"modifierPercent\":0}");

        // aplicar overrides del usuario encima de los defaults del preset
        if (overrides != null) {
            for (CreateRunRequest.RuleOverride ov : overrides) {
                try {
                    RunRule.RuleType type = RunRule.RuleType.valueOf(ov.ruleType());
                    enabled.put(type, ov.enabled());
                    if (ov.value() != null) values.put(type, ov.value());
                } catch (IllegalArgumentException ignored) {}
            }
        }

        List<RunRule> rules = enabled.entrySet().stream().map(entry -> {
            RunRule rule = new RunRule();
            rule.setRun(run);
            rule.setRuleType(entry.getKey());
            rule.setEnabled(entry.getValue());
            rule.setValue(values.get(entry.getKey()));
            return rule;
        }).toList();

        runRuleRepository.saveAll(rules);
    }

    private int resolveMaxCatches(UUID runId) {
        List<RunRule> rules = runRuleRepository.findAllByRunId(runId);

        boolean firstEncounterOnly = rules.stream()
                .anyMatch(r -> r.getRuleType() == RunRule.RuleType.FIRST_ENCOUNTER_ONLY && r.isEnabled());
        if (firstEncounterOnly) return 1;

        return rules.stream()
                .filter(r -> r.getRuleType() == RunRule.RuleType.MAX_CATCHES_PER_ROUTE && r.isEnabled())
                .findFirst()
                .map(r -> {
                    if (r.getValue() != null) {
                        java.util.regex.Matcher m = java.util.regex.Pattern
                                .compile("\"max\"\\s*:\\s*(\\d+)").matcher(r.getValue());
                        if (m.find()) return Integer.parseInt(m.group(1));
                    }
                    return 1;
                })
                .orElse(Integer.MAX_VALUE);
    }

    private RulePreset resolvePreset(Long presetId) {
        if (presetId != null) {
            return rulePresetRepository.findById(presetId).orElse(null);
        }
        return rulePresetRepository.findByNameAndSystemTrue("Clásico").orElse(null);
    }

    private String generateSlug(UUID userId, String name) {
        String base = name.toLowerCase()
                .replaceAll("[^a-z0-9\\s-]", "")
                .replaceAll("\\s+", "-")
                .replaceAll("-+", "-")
                .replaceAll("^-|-$", "");
        if (base.isEmpty()) base = "run";
        if (base.length() > 180) base = base.substring(0, 180);

        String candidate = base;
        int suffix = 2;
        while (runRepository.existsByUserIdAndSlug(userId, candidate)) {
            candidate = base + "-" + suffix++;
        }
        return candidate;
    }

    private String resolveName(Long pokemonId) {
        return pokemonNameRepository.findNameByPokemonIdAndLang(pokemonId, "en")
                .orElse("Unknown");
    }

    private CaughtPokemonResponse toCaughtPokemonResponse(CaughtPokemon cp) {
        Long chainId = pokemonRepository.findChainId(cp.getOriginalPokemon().getId()).orElse(null);
        return CaughtPokemonResponse.from(cp, resolveName(cp.getCurrentPokemon().getId()), chainId);
    }

    /** Versión en lote: resuelve nombres y chainIds con una query cada uno, en vez de 2 por Pokémon. */
    private List<CaughtPokemonResponse> toCaughtPokemonResponses(List<CaughtPokemon> pokemons) {
        if (pokemons.isEmpty()) return List.of();

        Set<Long> currentIds = pokemons.stream()
                .map(cp -> cp.getCurrentPokemon().getId()).collect(Collectors.toSet());
        Set<Long> originalIds = pokemons.stream()
                .map(cp -> cp.getOriginalPokemon().getId()).collect(Collectors.toSet());

        Map<Long, String> names = pokemonNameRepository
                .findNamesByPokemonIdsAndLang(currentIds, "en").stream()
                .collect(Collectors.toMap(
                        PokemonNameRepository.NameProjection::getPokemonId,
                        PokemonNameRepository.NameProjection::getName));

        Map<Long, Long> chainIds = pokemonRepository.findChainIds(originalIds).stream()
                .collect(Collectors.toMap(
                        PokemonRepository.ChainIdProjection::getPokemonId,
                        PokemonRepository.ChainIdProjection::getChainId));

        return pokemons.stream()
                .map(cp -> CaughtPokemonResponse.from(
                        cp,
                        names.getOrDefault(cp.getCurrentPokemon().getId(), "Unknown"),
                        chainIds.get(cp.getOriginalPokemon().getId())))
                .toList();
    }

    private Map<UUID, Map<CaughtPokemon.Status, Long>> countPokemonByStatus(List<Run> runs) {
        if (runs.isEmpty()) return Map.of();
        List<UUID> runIds = runs.stream().map(Run::getId).toList();
        return caughtPokemonRepository.countByRunIdsGroupedByStatus(runIds).stream()
                .collect(Collectors.groupingBy(
                        CaughtPokemonRepository.RunStatusCountProjection::getRunId,
                        Collectors.toMap(
                                CaughtPokemonRepository.RunStatusCountProjection::getStatus,
                                CaughtPokemonRepository.RunStatusCountProjection::getCount)));
    }

    private void logStatus(CaughtPokemon cp, CaughtPokemon.Status status, String notes, boolean correction) {
        PokemonStatusLog log = new PokemonStatusLog();
        log.setCaughtPokemon(cp);
        log.setStatus(status);
        log.setNotes(notes);
        log.setCorrection(correction);
        pokemonStatusLogRepository.save(log);
    }

    private void emitEvent(Run run, RunEvent.EventType type, String payload) {
        RunEvent event = new RunEvent();
        event.setRun(run);
        event.setEventType(type);
        event.setPayload(payload);
        runEventRepository.save(event);
    }

    private void touchRunActivity(Run run) {
        run.setLastActivityAt(OffsetDateTime.now());
        runRepository.save(run);
    }

    private boolean isPermadeathEnabled(Run run) {
        return runRuleRepository.findAllByRunId(run.getId()).stream()
                .anyMatch(r -> r.getRuleType() == RunRule.RuleType.PERMADEATH && r.isEnabled());
    }

    private String jsonStr(String s) {
        return s != null ? "\"" + s.replace("\"", "\\\"") + "\"" : "null";
    }
}
