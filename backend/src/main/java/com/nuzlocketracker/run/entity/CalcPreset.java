package com.nuzlocketracker.run.entity;

import com.nuzlocketracker.catalog.entity.Ability;
import com.nuzlocketracker.catalog.entity.Item;
import com.nuzlocketracker.catalog.entity.Pokemon;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.OffsetDateTime;

@Entity
@Table(name = "calc_preset")
@Getter @Setter
public class CalcPreset {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "run_id")
    private Run run;

    @Column(nullable = false, length = 100)
    private String name;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "pokemon_id")
    private Pokemon pokemon;

    @Column(name = "form_variant", length = 50)
    private String formVariant;

    @Column(nullable = false)
    private Short level = 50;

    @Column(name = "ev_hp",    nullable = false) private Short evHp    = 0;
    @Column(name = "ev_atk",   nullable = false) private Short evAtk   = 0;
    @Column(name = "ev_def",   nullable = false) private Short evDef   = 0;
    @Column(name = "ev_sp_atk",nullable = false) private Short evSpAtk = 0;
    @Column(name = "ev_sp_def",nullable = false) private Short evSpDef = 0;
    @Column(name = "ev_spe",   nullable = false) private Short evSpe   = 0;

    @Column(name = "iv_hp",    nullable = false) private Short ivHp    = 31;
    @Column(name = "iv_atk",   nullable = false) private Short ivAtk   = 31;
    @Column(name = "iv_def",   nullable = false) private Short ivDef   = 31;
    @Column(name = "iv_sp_atk",nullable = false) private Short ivSpAtk = 31;
    @Column(name = "iv_sp_def",nullable = false) private Short ivSpDef = 31;
    @Column(name = "iv_spe",   nullable = false) private Short ivSpe   = 31;

    @Column(length = 20)
    private String nature;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ability_id")
    private Ability ability;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "item_id")
    private Item item;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @PrePersist void prePersist() { createdAt = updatedAt = OffsetDateTime.now(); }
    @PreUpdate  void preUpdate()  { updatedAt = OffsetDateTime.now(); }
}
