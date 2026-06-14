package com.nuzlocketracker.catalog.entity;

import java.io.Serializable;
import java.util.Objects;

public class BadgeNameId implements Serializable {

    private Long badge;
    private String lang;

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof BadgeNameId that)) return false;
        return Objects.equals(badge, that.badge) && Objects.equals(lang, that.lang);
    }

    @Override
    public int hashCode() {
        return Objects.hash(badge, lang);
    }
}
