package com.nuzlocketracker.catalog.entity;

import java.io.Serializable;
import java.util.Objects;

public class PokemonAbilityId implements Serializable {
    private Long pokemon;
    private Long ability;

    @Override public boolean equals(Object o) {
        if (!(o instanceof PokemonAbilityId that)) return false;
        return Objects.equals(pokemon, that.pokemon) && Objects.equals(ability, that.ability);
    }
    @Override public int hashCode() { return Objects.hash(pokemon, ability); }
}
