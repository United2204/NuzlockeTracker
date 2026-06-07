package com.nuzlocketracker.catalog.entity;

import java.io.Serializable;
import java.util.Objects;

public class AbilityNameId implements Serializable {
    private Long ability;
    private String lang;

    @Override public boolean equals(Object o) {
        if (!(o instanceof AbilityNameId that)) return false;
        return Objects.equals(ability, that.ability) && Objects.equals(lang, that.lang);
    }
    @Override public int hashCode() { return Objects.hash(ability, lang); }
}
