package com.nuzlocketracker.catalog.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "item_name")
@IdClass(ItemNameId.class)
@Getter @Setter
public class ItemName {

    @Id
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "item_id")
    private Item item;

    @Id
    @Column(length = 2)
    private String lang;

    @Column(nullable = false, length = 100)
    private String name;
}
