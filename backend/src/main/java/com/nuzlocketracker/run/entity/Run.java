package com.nuzlocketracker.run.entity;

import com.nuzlocketracker.auth.entity.User;
import com.nuzlocketracker.catalog.entity.Game;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "run")
@Getter @Setter
public class Run {

    public enum Status { ACTIVE, COMPLETED, GAME_OVER, ABANDONED }
    public enum Visibility { PUBLIC, FOLLOWERS_ONLY, PRIVATE }

    @Id
    @Column(columnDefinition = "uuid", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "game_id")
    private Game game;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(nullable = false, length = 200)
    private String slug;

    @Column(name = "game_version", length = 10)
    private String gameVersion;

    @Column(name = "is_randomized", nullable = false)
    private boolean randomized = false;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 15)
    private Status status = Status.ACTIVE;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Visibility visibility = Visibility.PRIVATE;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "event_visibility_config", nullable = false, columnDefinition = "jsonb")
    private String eventVisibilityConfig;

    @Column(name = "is_favorite", nullable = false)
    private boolean favorite = false;

    @Column(name = "display_order", nullable = false)
    private int displayOrder = 0;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "base_preset_id")
    private RulePreset basePreset;

    @Column(name = "subscriber_count", nullable = false)
    private int subscriberCount = 0;

    @Column(name = "last_activity_at")
    private OffsetDateTime lastActivityAt;

    @Column(name = "started_at", nullable = false, updatable = false)
    private OffsetDateTime startedAt;

    @Column(name = "ended_at")
    private OffsetDateTime endedAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @Column(name = "deleted_at")
    private OffsetDateTime deletedAt;

    @PrePersist
    void prePersist() {
        if (id == null) id = UUID.randomUUID();
        startedAt = OffsetDateTime.now();
        updatedAt = OffsetDateTime.now();
        lastActivityAt = OffsetDateTime.now();
        if (eventVisibilityConfig == null) {
            eventVisibilityConfig = """
                {"POKEMON_CAPTURED":true,"POKEMON_EVOLVED":true,"POKEMON_FAINTED":true,"BADGE_OBTAINED":true,"RUN_ENDED":true}
                """.strip();
        }
    }

    @PreUpdate
    void preUpdate() {
        updatedAt = OffsetDateTime.now();
    }
}
