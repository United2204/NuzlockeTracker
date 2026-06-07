package com.nuzlocketracker.calc;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.nuzlocketracker.calc.dto.ItemCalcResponse;
import com.nuzlocketracker.calc.dto.PokemonCalcDataResponse;
import com.nuzlocketracker.catalog.entity.Pokemon;
import com.nuzlocketracker.catalog.entity.PokemonBaseStats;
import com.nuzlocketracker.catalog.repository.*;
import com.nuzlocketracker.common.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class CalcService {

    private final PokemonRepository          pokemonRepository;
    private final PokemonBaseStatsRepository baseStatsRepository;
    private final PokemonNameRepository      nameRepository;
    private final PokemonLearnsetRepository  learnsetRepository;
    private final PokemonAbilityRepository   abilityRepository;
    private final ItemCalcEffectRepository   itemCalcEffectRepository;
    private final ObjectMapper               objectMapper;

    @Transactional(readOnly = true)
    public PokemonCalcDataResponse getCalcData(Long pokemonId, Long gameId, String lang) {
        Pokemon pokemon = pokemonRepository.findById(pokemonId)
                .orElseThrow(() -> new ResourceNotFoundException("Pokemon", pokemonId));

        PokemonBaseStats stats = baseStatsRepository.findById(pokemonId).orElse(null);
        String pokemonName = nameRepository.findNameByPokemonIdAndLang(pokemonId, lang)
                .orElseGet(() -> nameRepository.findNameByPokemonIdAndLang(pokemonId, "en").orElse(null));

        PokemonCalcDataResponse.BaseStatsDto statsDto = stats == null ? null :
                new PokemonCalcDataResponse.BaseStatsDto(
                        stats.getHp(), stats.getAttack(), stats.getDefense(),
                        stats.getSpAtk(), stats.getSpDef(), stats.getSpeed()
                );

        List<PokemonCalcDataResponse.AbilityDto> abilities =
                abilityRepository.findByPokemonId(pokemonId, lang)
                        .stream()
                        .map(a -> new PokemonCalcDataResponse.AbilityDto(
                                a.getAbilityId(), a.getName(), a.getSlot()))
                        .toList();

        List<PokemonCalcDataResponse.LearnsetEntryDto> learnset;
        if (gameId != null) {
            learnset = learnsetRepository.findByPokemonIdAndGame(pokemonId, gameId, lang)
                    .stream().map(this::toLearnsetDto).toList();
        } else {
            learnset = learnsetRepository.findByPokemonId(pokemonId, lang)
                    .stream().map(this::toLearnsetDto).toList();
        }

        return new PokemonCalcDataResponse(
                pokemon.getId(), pokemonName, pokemon.getTypes(),
                pokemon.getSpriteUrl(), statsDto, abilities, learnset
        );
    }

    @Transactional(readOnly = true)
    public List<ItemCalcResponse> getCalcItems(String lang) {
        return itemCalcEffectRepository.findAllWithNames(lang)
                .stream()
                .map(p -> {
                    Map<String, Object> effect;
                    try {
                        effect = objectMapper.readValue(p.getEffectJson(), new TypeReference<>() {});
                    } catch (Exception e) {
                        effect = Map.of();
                    }
                    return new ItemCalcResponse(p.getItemId(), p.getName(), effect);
                })
                .toList();
    }

    private PokemonCalcDataResponse.LearnsetEntryDto toLearnsetDto(
            PokemonLearnsetRepository.LearnsetEntryProjection p) {
        return new PokemonCalcDataResponse.LearnsetEntryDto(
                p.getMoveId(), p.getName(), p.getType(), p.getCategory(),
                p.getPower(), p.getAccuracy(),
                p.getPriority() != null ? p.getPriority() : 0,
                p.getLearnMethod(), p.getLevelLearned()
        );
    }
}
