package com.nuzlocketracker.catalog.entity;

import java.io.Serializable;
import java.util.Objects;

public class MoveNameId implements Serializable {
    private Long move;
    private String lang;

    @Override public boolean equals(Object o) {
        if (!(o instanceof MoveNameId that)) return false;
        return Objects.equals(move, that.move) && Objects.equals(lang, that.lang);
    }
    @Override public int hashCode() { return Objects.hash(move, lang); }
}
