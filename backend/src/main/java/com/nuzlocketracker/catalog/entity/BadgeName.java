package com.nuzlocketracker.catalog.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "badge_name")
@IdClass(BadgeNameId.class)
@Getter @Setter
public class BadgeName {

    @Id
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "badge_id")
    private Badge badge;

    @Id
    @Column(length = 2)
    private String lang;

    @Column(nullable = false, length = 100)
    private String name;
}
