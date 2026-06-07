package com.nuzlocketracker.calc.dto;

import java.time.OffsetDateTime;

public record CalcPresetResponse(
        Long id,
        String name,
        Long pokemonId,
        String formVariant,
        short level,
        short evHp, short evAtk, short evDef, short evSpAtk, short evSpDef, short evSpe,
        short ivHp, short ivAtk, short ivDef, short ivSpAtk, short ivSpDef, short ivSpe,
        String nature,
        Long abilityId,
        Long itemId,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {}
