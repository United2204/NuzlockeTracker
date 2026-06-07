package com.nuzlocketracker.auth.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "user_settings")
@Getter
@Setter
@NoArgsConstructor
public class UserSettings {

    @Id
    @Column(name = "user_id", columnDefinition = "uuid")
    private UUID userId;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "allow_followers", nullable = false)
    private boolean allowFollowers = true;

    @Column(length = 2)
    private String language;

    @Column(name = "last_seen_notifications_at")
    private OffsetDateTime lastSeenNotificationsAt;

    // notification_preferences not mapped — uses DB default (see V2 migration)
}
