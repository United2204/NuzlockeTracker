package com.nuzlocketracker.catalog.entity;

import java.io.Serializable;
import java.util.Objects;

public class RouteNameId implements Serializable {

    private Long route;
    private String lang;

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof RouteNameId that)) return false;
        return Objects.equals(route, that.route) && Objects.equals(lang, that.lang);
    }

    @Override
    public int hashCode() {
        return Objects.hash(route, lang);
    }
}
