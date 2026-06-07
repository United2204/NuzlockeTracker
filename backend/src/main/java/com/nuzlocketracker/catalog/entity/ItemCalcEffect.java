package com.nuzlocketracker.catalog.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.Map;

@Entity
@Table(name = "item_calc_effect")
@Getter @Setter
public class ItemCalcEffect {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "item_id")
    private Item item;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "effect_json", nullable = false, columnDefinition = "jsonb")
    private Map<String, Object> effectJson;
}
