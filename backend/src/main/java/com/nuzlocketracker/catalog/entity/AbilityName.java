package com.nuzlocketracker.catalog.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "ability_name")
@IdClass(AbilityNameId.class)
@Getter @Setter
public class AbilityName {

    @Id
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ability_id")
    private Ability ability;

    @Id
    @Column(length = 2)
    private String lang;

    @Column(nullable = false, length = 100)
    private String name;
}
