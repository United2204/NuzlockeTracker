package com.nuzlocketracker.calc.dto;

import java.util.List;

public record PokemonCalcDataResponse(
        Long id,
        String name,
        List<String> types,
        String spriteUrl,
        BaseStatsDto baseStats,
        List<AbilityDto> abilities,
        List<LearnsetEntryDto> learnset
) {
    public record BaseStatsDto(short hp, short attack, short defense, short spAtk, short spDef, short speed) {}

    public record AbilityDto(long abilityId, String name, String slot) {}

    public record LearnsetEntryDto(
            long moveId,
            String name,
            String type,
            String category,
            Short power,
            Short accuracy,
            short priority,
            String learnMethod,
            Short levelLearned
    ) {}
}
