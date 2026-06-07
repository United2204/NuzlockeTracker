package com.nuzlocketracker.social.entity;

import com.nuzlocketracker.auth.entity.User;
import com.nuzlocketracker.run.entity.Run;
import com.nuzlocketracker.run.entity.RunEvent;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.OffsetDateTime;

@Entity
@Table(name = "run_comment")
@Getter @Setter
public class RunComment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "run_id")
    private Run run;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_comment_id")
    private RunComment parent;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "run_event_id")
    private RunEvent runEvent;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "deleted_at")
    private OffsetDateTime deletedAt;

    @PrePersist
    void prePersist() { createdAt = OffsetDateTime.now(); }
}
