package com.nuzlocketracker.catalog.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.List;

@Entity
@Table(name = "game")
@Getter @Setter
public class Game {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false)
    private Short generation;

    @Column(name = "is_official", nullable = false)
    private boolean official = true;

    @JdbcTypeCode(SqlTypes.JSON)
    private List<String> versions;

    @Column(name = "cover_image_url", length = 500)
    private String coverImageUrl;
}
