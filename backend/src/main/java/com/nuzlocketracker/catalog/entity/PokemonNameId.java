package com.nuzlocketracker.catalog.entity;

import java.io.Serializable;
import java.util.Objects;

public class PokemonNameId implements Serializable {

    private Long pokemon;
    private String lang;

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof PokemonNameId that)) return false;
        return Objects.equals(pokemon, that.pokemon) && Objects.equals(lang, that.lang);
    }

    @Override
    public int hashCode() {
        return Objects.hash(pokemon, lang);
    }
}
