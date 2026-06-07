package com.nuzlocketracker.catalog.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "pokemon_ability")
@IdClass(PokemonAbilityId.class)
@Getter @Setter
public class PokemonAbility {

    @Id
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pokemon_id")
    private Pokemon pokemon;

    @Id
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ability_id")
    private Ability ability;

    @Column(nullable = false, length = 10)
    private String slot;
}
