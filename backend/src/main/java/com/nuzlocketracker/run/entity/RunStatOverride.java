package com.nuzlocketracker.run.entity;

import com.nuzlocketracker.catalog.entity.Pokemon;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "run_stat_override")
@Getter @Setter
public class RunStatOverride {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "run_id")
    private Run run;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "pokemon_id")
    private Pokemon pokemon;

    @Column(nullable = false) private Short hp;
    @Column(nullable = false) private Short attack;
    @Column(nullable = false) private Short defense;
    @Column(name = "sp_atk", nullable = false) private Short spAtk;
    @Column(name = "sp_def", nullable = false) private Short spDef;
    @Column(nullable = false) private Short speed;
}
