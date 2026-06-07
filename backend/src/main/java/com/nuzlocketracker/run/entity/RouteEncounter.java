package com.nuzlocketracker.run.entity;

import com.nuzlocketracker.catalog.entity.Route;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "route_encounter")
@Getter @Setter
public class RouteEncounter {

    public enum Outcome {
        PENDING, DEFERRED, CAPTURED, FAILED, DIED_IN_ENCOUNTER, NOT_FOUND
    }

    @Id
    @Column(columnDefinition = "uuid", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "run_id")
    private Run run;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "route_id")
    private Route route;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 25)
    private Outcome outcome = Outcome.PENDING;

    @Column(columnDefinition = "text")
    private String notes;

    @Column(name = "encountered_at")
    private OffsetDateTime encounteredAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @Column(name = "deleted_at")
    private OffsetDateTime deletedAt;

    @PrePersist
    void prePersist() {
        if (id == null) id = UUID.randomUUID();
        updatedAt = OffsetDateTime.now();
    }

    @PreUpdate
    void preUpdate() {
        updatedAt = OffsetDateTime.now();
    }
}
