package com.nuzlocketracker.catalog.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.List;

@Entity
@Table(name = "pokemon")
@Getter @Setter
public class Pokemon {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "species_id", nullable = false)
    private Long speciesId;

    @Column(name = "national_dex_number")
    private Short nationalDexNumber;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(nullable = false)
    private List<String> types;

    @Column(name = "sprite_url", length = 500)
    private String spriteUrl;

    @Column(length = 50)
    private String variant;

    @Column(name = "is_from_fangame", nullable = false)
    private boolean fromFangame = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "game_id")
    private Game game;

    @Column(name = "evolves_from_pokemon_id")
    private Long evolvesFromPokemonId;
}
