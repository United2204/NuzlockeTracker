package com.nuzlocketracker.run.entity;

import com.nuzlocketracker.catalog.entity.Badge;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.OffsetDateTime;

@Entity
@Table(name = "run_badge")
@Getter @Setter
public class RunBadge {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "run_id")
    private Run run;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "badge_id")
    private Badge badge;

    @Column(name = "obtained_at", nullable = false)
    private OffsetDateTime obtainedAt;

    @PrePersist
    void prePersist() {
        obtainedAt = OffsetDateTime.now();
    }
}
