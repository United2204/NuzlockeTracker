package com.nuzlocketracker.social.entity;

import java.io.Serializable;
import java.util.Objects;
import java.util.UUID;

public class RunFavoriteId implements Serializable {
    private UUID user;
    private UUID run;

    @Override
    public boolean equals(Object o) {
        if (!(o instanceof RunFavoriteId that)) return false;
        return Objects.equals(user, that.user) && Objects.equals(run, that.run);
    }

    @Override
    public int hashCode() { return Objects.hash(user, run); }
}
