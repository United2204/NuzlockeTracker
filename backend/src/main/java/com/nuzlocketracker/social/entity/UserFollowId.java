package com.nuzlocketracker.social.entity;

import java.io.Serializable;
import java.util.Objects;
import java.util.UUID;

public class UserFollowId implements Serializable {
    private UUID follower;
    private UUID followed;

    @Override
    public boolean equals(Object o) {
        if (!(o instanceof UserFollowId that)) return false;
        return Objects.equals(follower, that.follower) && Objects.equals(followed, that.followed);
    }

    @Override
    public int hashCode() { return Objects.hash(follower, followed); }
}
