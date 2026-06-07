package com.nuzlocketracker.catalog.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "move_name")
@IdClass(MoveNameId.class)
@Getter @Setter
public class MoveName {

    @Id
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "move_id")
    private Move move;

    @Id
    @Column(length = 2)
    private String lang;

    @Column(nullable = false, length = 100)
    private String name;
}
