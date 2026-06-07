package com.nuzlocketracker.catalog.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "pokemon_name")
@IdClass(PokemonNameId.class)
@Getter @Setter
public class PokemonName {

    @Id
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pokemon_id")
    private Pokemon pokemon;

    @Id
    @Column(length = 2)
    private String lang;

    @Column(nullable = false, length = 100)
    private String name;
}
