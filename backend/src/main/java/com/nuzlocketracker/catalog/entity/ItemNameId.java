package com.nuzlocketracker.catalog.entity;

import java.io.Serializable;
import java.util.Objects;

public class ItemNameId implements Serializable {
    private Long item;
    private String lang;

    @Override public boolean equals(Object o) {
        if (!(o instanceof ItemNameId that)) return false;
        return Objects.equals(item, that.item) && Objects.equals(lang, that.lang);
    }
    @Override public int hashCode() { return Objects.hash(item, lang); }
}
