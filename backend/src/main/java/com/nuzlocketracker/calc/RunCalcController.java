package com.nuzlocketracker.calc;

import com.nuzlocketracker.calc.dto.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/runs/{runId}")
@RequiredArgsConstructor
public class RunCalcController {

    private final RunCalcService runCalcService;

    // ── CalcPresets ─────────────────────────────────────────────────────────

    @GetMapping("/calc-presets")
    public List<CalcPresetResponse> listPresets(@PathVariable UUID runId, Authentication auth) {
        return runCalcService.listPresets(runId, userId(auth));
    }

    @PostMapping("/calc-presets")
    @ResponseStatus(HttpStatus.CREATED)
    public CalcPresetResponse createPreset(
            @PathVariable UUID runId,
            @Valid @RequestBody CalcPresetRequest req,
            Authentication auth
    ) {
        return runCalcService.createPreset(runId, userId(auth), req);
    }

    @PutMapping("/calc-presets/{presetId}")
    public CalcPresetResponse updatePreset(
            @PathVariable UUID runId,
            @PathVariable Long presetId,
            @Valid @RequestBody CalcPresetRequest req,
            Authentication auth
    ) {
        return runCalcService.updatePreset(runId, presetId, userId(auth), req);
    }

    @DeleteMapping("/calc-presets/{presetId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deletePreset(
            @PathVariable UUID runId,
            @PathVariable Long presetId,
            Authentication auth
    ) {
        runCalcService.deletePreset(runId, presetId, userId(auth));
    }

    // ── Stat Overrides ──────────────────────────────────────────────────────

    @GetMapping("/stat-overrides")
    public List<StatOverrideResponse> listOverrides(@PathVariable UUID runId, Authentication auth) {
        return runCalcService.listOverrides(runId, userId(auth));
    }

    @PutMapping("/stat-overrides/{pokemonId}")
    public StatOverrideResponse upsertOverride(
            @PathVariable UUID runId,
            @PathVariable Long pokemonId,
            @Valid @RequestBody StatOverrideRequest req,
            Authentication auth
    ) {
        return runCalcService.upsertOverride(runId, pokemonId, userId(auth), req);
    }

    @DeleteMapping("/stat-overrides/{pokemonId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteOverride(
            @PathVariable UUID runId,
            @PathVariable Long pokemonId,
            Authentication auth
    ) {
        runCalcService.deleteOverride(runId, pokemonId, userId(auth));
    }

    private UUID userId(Authentication auth) {
        return UUID.fromString(auth.getName());
    }
}
