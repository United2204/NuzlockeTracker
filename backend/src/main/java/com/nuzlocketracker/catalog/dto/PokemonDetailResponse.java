package com.nuzlocketracker.catalog.dto;

import com.nuzlocketracker.catalog.entity.Pokemon;
import com.nuzlocketracker.catalog.entity.PokemonBaseStats;
import com.nuzlocketracker.catalog.repository.PokemonAbilityRepository;

import java.util.List;

public record PokemonDetailResponse(
        Long id,
        Long speciesId,
        Integer nationalDexNumber,
        List<String> types,
        String spriteUrl,
        String variant,
        String name,
        BaseStats baseStats,
        List<AbilityEntry> abilities
) {
    public record BaseStats(int hp, int attack, int defense, int spAtk, int spDef, int speed) {
        static BaseStats from(PokemonBaseStats s) {
            return new BaseStats(s.getHp(), s.getAttack(), s.getDefense(), s.getSpAtk(), s.getSpDef(), s.getSpeed());
        }
    }

    public record AbilityEntry(String name, String slot, boolean hidden) {
        static AbilityEntry from(PokemonAbilityRepository.AbilityEntryProjection p) {
            return new AbilityEntry(p.getName() != null ? p.getName() : "", p.getSlot(), "HIDDEN".equals(p.getSlot()));
        }
    }

    public static PokemonDetailResponse from(
            Pokemon p,
            String name,
            PokemonBaseStats stats,
            List<PokemonAbilityRepository.AbilityEntryProjection> abilities
    ) {
        return new PokemonDetailResponse(
                p.getId(),
                p.getSpeciesId(),
                p.getNationalDexNumber() != null ? (int) p.getNationalDexNumber() : null,
                p.getTypes(),
                p.getSpriteUrl(),
                p.getVariant(),
                name,
                stats != null ? BaseStats.from(stats) : null,
                abilities.stream().map(AbilityEntry::from).toList()
        );
    }
}
