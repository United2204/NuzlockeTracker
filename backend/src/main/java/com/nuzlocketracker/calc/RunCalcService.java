package com.nuzlocketracker.calc;

import com.nuzlocketracker.calc.dto.*;
import com.nuzlocketracker.catalog.repository.AbilityRepository;
import com.nuzlocketracker.catalog.repository.ItemRepository;
import com.nuzlocketracker.catalog.repository.PokemonRepository;
import com.nuzlocketracker.common.exception.ResourceNotFoundException;
import com.nuzlocketracker.run.entity.CalcPreset;
import com.nuzlocketracker.run.entity.Run;
import com.nuzlocketracker.run.entity.RunStatOverride;
import com.nuzlocketracker.run.repository.CalcPresetRepository;
import com.nuzlocketracker.run.repository.RunRepository;
import com.nuzlocketracker.run.repository.RunStatOverrideRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RunCalcService {

    private final RunRepository            runRepository;
    private final PokemonRepository        pokemonRepository;
    private final AbilityRepository        abilityRepository;
    private final ItemRepository           itemRepository;
    private final CalcPresetRepository     presetRepository;
    private final RunStatOverrideRepository overrideRepository;

    // ── CalcPreset ──────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<CalcPresetResponse> listPresets(UUID runId, UUID userId) {
        Run run = getRunForUser(runId, userId);
        return presetRepository.findByRunIdOrderByCreatedAtAsc(run.getId())
                .stream().map(this::toPresetResponse).toList();
    }

    @Transactional
    public CalcPresetResponse createPreset(UUID runId, UUID userId, CalcPresetRequest req) {
        Run run = getRunForUser(runId, userId);
        CalcPreset preset = applyRequest(new CalcPreset(), req);
        preset.setRun(run);
        return toPresetResponse(presetRepository.save(preset));
    }

    @Transactional
    public CalcPresetResponse updatePreset(UUID runId, Long presetId, UUID userId, CalcPresetRequest req) {
        getRunForUser(runId, userId);
        CalcPreset preset = presetRepository.findById(presetId)
                .filter(p -> p.getRun().getId().equals(runId))
                .orElseThrow(() -> new ResourceNotFoundException("CalcPreset", presetId));
        return toPresetResponse(presetRepository.save(applyRequest(preset, req)));
    }

    @Transactional
    public void deletePreset(UUID runId, Long presetId, UUID userId) {
        getRunForUser(runId, userId);
        CalcPreset preset = presetRepository.findById(presetId)
                .filter(p -> p.getRun().getId().equals(runId))
                .orElseThrow(() -> new ResourceNotFoundException("CalcPreset", presetId));
        presetRepository.delete(preset);
    }

    // ── RunStatOverride ─────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<StatOverrideResponse> listOverrides(UUID runId, UUID userId) {
        getRunForUser(runId, userId);
        return overrideRepository.findByRunId(runId)
                .stream().map(this::toOverrideResponse).toList();
    }

    @Transactional
    public StatOverrideResponse upsertOverride(UUID runId, Long pokemonId, UUID userId, StatOverrideRequest req) {
        Run run = getRunForUser(runId, userId);
        RunStatOverride override = overrideRepository.findByRunIdAndPokemonId(runId, pokemonId)
                .orElseGet(RunStatOverride::new);
        override.setRun(run);
        override.setPokemon(pokemonRepository.getReferenceById(pokemonId));
        override.setHp(req.hp());
        override.setAttack(req.attack());
        override.setDefense(req.defense());
        override.setSpAtk(req.spAtk());
        override.setSpDef(req.spDef());
        override.setSpeed(req.speed());
        return toOverrideResponse(overrideRepository.save(override));
    }

    @Transactional
    public void deleteOverride(UUID runId, Long pokemonId, UUID userId) {
        getRunForUser(runId, userId);
        overrideRepository.deleteByRunIdAndPokemonId(runId, pokemonId);
    }

    // ── Helpers ─────────────────────────────────────────────────────────────

    private Run getRunForUser(UUID runId, UUID userId) {
        Run run = runRepository.findById(runId)
                .orElseThrow(() -> new ResourceNotFoundException("Run", runId));
        if (!run.getUser().getId().equals(userId)) {
            throw new ResourceNotFoundException("Run", runId);
        }
        return run;
    }

    private CalcPreset applyRequest(CalcPreset preset, CalcPresetRequest req) {
        preset.setName(req.name());
        preset.setPokemon(pokemonRepository.getReferenceById(req.pokemonId()));
        preset.setFormVariant(req.formVariant());
        preset.setLevel(req.level() != null ? req.level() : 50);
        preset.setEvHp(req.evHp()    != null ? req.evHp()    : 0);
        preset.setEvAtk(req.evAtk()  != null ? req.evAtk()   : 0);
        preset.setEvDef(req.evDef()  != null ? req.evDef()   : 0);
        preset.setEvSpAtk(req.evSpAtk() != null ? req.evSpAtk() : 0);
        preset.setEvSpDef(req.evSpDef() != null ? req.evSpDef() : 0);
        preset.setEvSpe(req.evSpe()  != null ? req.evSpe()   : 0);
        preset.setIvHp(req.ivHp()    != null ? req.ivHp()    : 31);
        preset.setIvAtk(req.ivAtk()  != null ? req.ivAtk()   : 31);
        preset.setIvDef(req.ivDef()  != null ? req.ivDef()   : 31);
        preset.setIvSpAtk(req.ivSpAtk() != null ? req.ivSpAtk() : 31);
        preset.setIvSpDef(req.ivSpDef() != null ? req.ivSpDef() : 31);
        preset.setIvSpe(req.ivSpe()  != null ? req.ivSpe()   : 31);
        preset.setNature(req.nature());
        preset.setAbility(req.abilityId() != null ? abilityRepository.getReferenceById(req.abilityId()) : null);
        preset.setItem(req.itemId() != null ? itemRepository.getReferenceById(req.itemId()) : null);
        return preset;
    }

    private CalcPresetResponse toPresetResponse(CalcPreset p) {
        return new CalcPresetResponse(
                p.getId(), p.getName(),
                p.getPokemon().getId(), p.getFormVariant(),
                p.getLevel(),
                p.getEvHp(), p.getEvAtk(), p.getEvDef(), p.getEvSpAtk(), p.getEvSpDef(), p.getEvSpe(),
                p.getIvHp(), p.getIvAtk(), p.getIvDef(), p.getIvSpAtk(), p.getIvSpDef(), p.getIvSpe(),
                p.getNature(),
                p.getAbility() != null ? p.getAbility().getId() : null,
                p.getItem()    != null ? p.getItem().getId()    : null,
                p.getCreatedAt(), p.getUpdatedAt()
        );
    }

    private StatOverrideResponse toOverrideResponse(RunStatOverride o) {
        return new StatOverrideResponse(
                o.getPokemon().getId(),
                o.getHp(), o.getAttack(), o.getDefense(),
                o.getSpAtk(), o.getSpDef(), o.getSpeed()
        );
    }
}
