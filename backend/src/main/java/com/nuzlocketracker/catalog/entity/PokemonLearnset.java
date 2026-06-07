package com.nuzlocketracker.catalog.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "pokemon_learnset")
@IdClass(PokemonLearnsetId.class)
@Getter @Setter
public class PokemonLearnset {

    @Id
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pokemon_id")
    private Pokemon pokemon;

    @Id
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "move_id")
    private Move move;

    @Id
    @Column(name = "learn_method", nullable = false, length = 10)
    private String learnMethod;

    @Column(name = "level_learned")
    private Short levelLearned;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "game_id")
    private Game game;
}
