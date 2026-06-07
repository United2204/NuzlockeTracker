package com.nuzlocketracker.catalog.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "move")
@Getter @Setter
public class Move {

    public enum Category { PHYSICAL, SPECIAL, STATUS }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 20)
    private String type;

    private Short power;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private Category category;

    private Short accuracy;

    @Column(nullable = false)
    private Short priority = 0;
}
