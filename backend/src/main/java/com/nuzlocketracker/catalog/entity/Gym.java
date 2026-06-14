package com.nuzlocketracker.catalog.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "gym")
@Getter @Setter
public class Gym {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "game_id")
    private Game game;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "badge_id")
    private Badge badge;

    @Column(name = "leader_name", nullable = false, length = 100)
    private String leaderName;

    @Column(name = "display_order", nullable = false)
    private Short displayOrder;

    @Column(name = "ace_pokemon_level", nullable = false)
    private Short acePokemonLevel;
}
