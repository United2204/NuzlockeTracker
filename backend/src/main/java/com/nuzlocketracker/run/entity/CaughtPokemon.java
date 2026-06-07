package com.nuzlocketracker.run.entity;

import com.nuzlocketracker.catalog.entity.Pokemon;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "caught_pokemon")
@Getter @Setter
public class CaughtPokemon {

    public enum Status { ACTIVE, BOXED, FAINTED }

    @Id
    @Column(columnDefinition = "uuid", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "run_id")
    private Run run;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "route_encounter_id")
    private RouteEncounter routeEncounter;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "original_pokemon_id")
    private Pokemon originalPokemon;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "current_pokemon_id")
    private Pokemon currentPokemon;

    @Column(length = 50)
    private String nickname;

    @Column(name = "is_shiny", nullable = false)
    private boolean shiny = false;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private Status status = Status.ACTIVE;

    @Column(name = "caught_at", nullable = false, updatable = false)
    private OffsetDateTime caughtAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @PrePersist
    void prePersist() {
        if (id == null) id = UUID.randomUUID();
        caughtAt = OffsetDateTime.now();
        updatedAt = OffsetDateTime.now();
    }

    @PreUpdate
    void preUpdate() {
        updatedAt = OffsetDateTime.now();
    }
}
