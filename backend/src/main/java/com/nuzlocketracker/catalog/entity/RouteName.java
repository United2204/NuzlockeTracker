package com.nuzlocketracker.catalog.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "route_name")
@IdClass(RouteNameId.class)
@Getter @Setter
public class RouteName {

    @Id
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "route_id")
    private Route route;

    @Id
    @Column(length = 2)
    private String lang;

    @Column(nullable = false, length = 150)
    private String name;
}
