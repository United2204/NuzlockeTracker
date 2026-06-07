package com.nuzlocketracker.social.entity;

import com.nuzlocketracker.auth.entity.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.OffsetDateTime;

@Entity
@Table(name = "user_follow")
@IdClass(UserFollowId.class)
@Getter @Setter
public class UserFollow {

    @Id
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "follower_id")
    private User follower;

    @Id
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "followed_id")
    private User followed;

    @Column(name = "followed_at", nullable = false)
    private OffsetDateTime followedAt;

    @PrePersist
    void prePersist() { followedAt = OffsetDateTime.now(); }
}
