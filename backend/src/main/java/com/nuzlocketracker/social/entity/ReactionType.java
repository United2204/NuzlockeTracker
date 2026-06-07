package com.nuzlocketracker.social.entity;

import com.nuzlocketracker.auth.entity.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "reaction_type")
@Getter @Setter
public class ReactionType {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 50)
    private String label;

    @Column(length = 10)
    private String emoji;

    @Column(name = "image_url", length = 500)
    private String imageUrl;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id")
    private User owner;

    @Column(name = "is_active", nullable = false)
    private boolean active = true;
}
