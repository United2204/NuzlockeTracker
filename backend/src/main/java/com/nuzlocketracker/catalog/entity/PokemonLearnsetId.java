package com.nuzlocketracker.catalog.entity;

import java.io.Serializable;
import java.util.Objects;

public class PokemonLearnsetId implements Serializable {
    private Long pokemon;
    private Long move;
    private String learnMethod;

    @Override public boolean equals(Object o) {
        if (!(o instanceof PokemonLearnsetId that)) return false;
        return Objects.equals(pokemon, that.pokemon) && Objects.equals(move, that.move) && Objects.equals(learnMethod, that.learnMethod);
    }
    @Override public int hashCode() { return Objects.hash(pokemon, move, learnMethod); }
}
