package com.nuzlocketracker.social.entity;

import com.nuzlocketracker.auth.entity.User;
import com.nuzlocketracker.run.entity.Run;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.OffsetDateTime;

@Entity
@Table(name = "run_favorite")
@IdClass(RunFavoriteId.class)
@Getter @Setter
public class RunFavorite {

    @Id
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id")
    private User user;

    @Id
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "run_id")
    private Run run;

    @Column(name = "saved_at", nullable = false)
    private OffsetDateTime savedAt;

    @PrePersist
    void prePersist() { savedAt = OffsetDateTime.now(); }
}
