package com.nuzlocketracker.catalog.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "route")
@Getter @Setter
public class Route {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "game_id")
    private Game game;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(name = "display_order", nullable = false)
    private Short displayOrder;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "required_badge_id")
    private Badge requiredBadge;

    @Column(name = "encounter_type", nullable = false, length = 30)
    @Enumerated(EnumType.STRING)
    private EncounterType encounterType;

    public enum EncounterType {
        RANDOM, STATIC, GIFT, STARTER, FOSSIL, LEGENDARY, TRADE
    }
}
