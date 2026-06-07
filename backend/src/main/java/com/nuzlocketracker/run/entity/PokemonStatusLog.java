package com.nuzlocketracker.run.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.OffsetDateTime;

@Entity
@Table(name = "pokemon_status_log")
@Getter @Setter
public class PokemonStatusLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "caught_pokemon_id")
    private CaughtPokemon caughtPokemon;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private CaughtPokemon.Status status;

    @Column(name = "occurred_at", nullable = false)
    private OffsetDateTime occurredAt;

    @Column(columnDefinition = "text")
    private String notes;

    @Column(name = "is_correction", nullable = false)
    private boolean correction = false;

    @PrePersist
    void prePersist() {
        occurredAt = OffsetDateTime.now();
    }
}
