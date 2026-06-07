package com.nuzlocketracker.catalog.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "pokemon_base_stats")
@Getter @Setter
public class PokemonBaseStats {

    @Id
    @Column(name = "pokemon_id")
    private Long pokemonId;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "pokemon_id")
    private Pokemon pokemon;

    @Column(nullable = false)
    private Short hp;

    @Column(nullable = false)
    private Short attack;

    @Column(nullable = false)
    private Short defense;

    @Column(name = "sp_atk", nullable = false)
    private Short spAtk;

    @Column(name = "sp_def", nullable = false)
    private Short spDef;

    @Column(nullable = false)
    private Short speed;
}
