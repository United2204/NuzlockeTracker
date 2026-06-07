package com.nuzlocketracker.social.entity;

import com.nuzlocketracker.auth.entity.User;
import com.nuzlocketracker.run.entity.Run;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.OffsetDateTime;

@Entity
@Table(name = "run_subscription")
@Getter @Setter
public class RunSubscription {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "run_id")
    private Run run;

    @Column(name = "subscribed_at", nullable = false)
    private OffsetDateTime subscribedAt;

    @PrePersist
    void prePersist() { subscribedAt = OffsetDateTime.now(); }
}
