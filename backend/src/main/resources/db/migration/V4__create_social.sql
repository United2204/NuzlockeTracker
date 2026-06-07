-- ============================================================
-- V4 — Social: follows, suscripciones, favoritos, comentarios,
--       reacciones, notificaciones, contribuciones comunitarias
-- ============================================================

-- ──────────────────────────────────────────────────────────
-- SOCIAL — SEGUIR / SUSCRIBIRSE / FAVORITOS
-- ──────────────────────────────────────────────────────────

CREATE TABLE user_follow (
    follower_id  UUID        NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    followed_id  UUID        NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    followed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (follower_id, followed_id),
    CHECK (follower_id <> followed_id)
);

CREATE TABLE run_subscription (
    id             BIGSERIAL   PRIMARY KEY,
    user_id        UUID        NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    run_id         UUID        NOT NULL REFERENCES run(id)  ON DELETE CASCADE,
    subscribed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, run_id)
);

CREATE TABLE run_favorite (
    user_id   UUID        NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    run_id    UUID        NOT NULL REFERENCES run(id)    ON DELETE CASCADE,
    saved_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, run_id)
);

-- ──────────────────────────────────────────────────────────
-- BLOQUEOS
-- ──────────────────────────────────────────────────────────

CREATE TABLE user_block (
    id          BIGSERIAL   PRIMARY KEY,
    blocker_id  UUID        NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    blocked_id  UUID        NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (blocker_id, blocked_id),
    CHECK (blocker_id <> blocked_id)
);

-- ──────────────────────────────────────────────────────────
-- COMENTARIOS
-- ──────────────────────────────────────────────────────────

CREATE TABLE run_comment (
    id                BIGSERIAL   PRIMARY KEY,
    run_id            UUID        NOT NULL REFERENCES run(id)         ON DELETE CASCADE,
    user_id           UUID        NOT NULL REFERENCES "user"(id),
    parent_comment_id BIGINT      REFERENCES run_comment(id),         -- NULL = top-level
    run_event_id      BIGINT      REFERENCES run_event(id),           -- solo en top-level
    content           TEXT        NOT NULL,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at        TIMESTAMPTZ                                     -- soft delete
);

-- ──────────────────────────────────────────────────────────
-- REACCIONES
-- ──────────────────────────────────────────────────────────

CREATE TABLE reaction_type (
    id          BIGSERIAL   PRIMARY KEY,
    label       VARCHAR(50) NOT NULL,
    emoji       VARCHAR(10),
    image_url   VARCHAR(500),
    owner_id    UUID        REFERENCES "user"(id) ON DELETE CASCADE,  -- NULL = global
    is_active   BOOLEAN     NOT NULL DEFAULT TRUE,
    UNIQUE (owner_id, label)
);

-- Reacciones globales del sistema
INSERT INTO reaction_type (label, emoji, owner_id, is_active) VALUES
    ('LIKE',  '👍', NULL, TRUE),
    ('RIP',   '💀', NULL, TRUE),
    ('HYPE',  '🔥', NULL, TRUE),
    ('GG',    '🎉', NULL, TRUE);

CREATE TABLE run_reaction (
    id               BIGSERIAL   PRIMARY KEY,
    run_id           UUID        NOT NULL REFERENCES run(id)           ON DELETE CASCADE,
    user_id          UUID        NOT NULL REFERENCES "user"(id)        ON DELETE CASCADE,
    reaction_type_id BIGINT      NOT NULL REFERENCES reaction_type(id),
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (run_id, user_id, reaction_type_id)
);

-- ──────────────────────────────────────────────────────────
-- NOTIFICACIONES
-- ──────────────────────────────────────────────────────────

CREATE TABLE notification (
    id            BIGSERIAL   PRIMARY KEY,
    user_id       UUID        NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    type          VARCHAR(30) NOT NULL CHECK (type IN (
                      'POKEMON_CAPTURED','POKEMON_FAINTED','BADGE_OBTAINED',
                      'RUN_ENDED','NEW_FOLLOWER','NEW_COMMENT','NEW_REACTION'
                  )),
    reference_id  BIGINT      NOT NULL,                              -- runEventId, commentId o userId
    is_read       BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ──────────────────────────────────────────────────────────
-- CONTRIBUCIONES COMUNITARIAS (fangames)
-- ──────────────────────────────────────────────────────────

CREATE TABLE community_contribution (
    id               BIGSERIAL   PRIMARY KEY,
    contributor_id   UUID        NOT NULL REFERENCES "user"(id),
    status           VARCHAR(25) NOT NULL DEFAULT 'PENDING'
        CHECK (status IN ('PENDING','APPROVED','REJECTED','CHANGES_REQUESTED')),
    game_id          BIGINT      NOT NULL REFERENCES game(id),
    data_type        VARCHAR(20) NOT NULL CHECK (data_type IN ('ROUTE','ENCOUNTER_TABLE','POKEMON')),
    data_json        JSONB       NOT NULL,
    reviewed_by      UUID        REFERENCES "user"(id),
    admin_feedback   TEXT,                                           -- para CHANGES_REQUESTED
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reviewed_at      TIMESTAMPTZ
);

-- ──────────────────────────────────────────────────────────
-- ÍNDICES
-- ──────────────────────────────────────────────────────────

CREATE INDEX idx_follow_follower    ON user_follow(follower_id);
CREATE INDEX idx_follow_followed    ON user_follow(followed_id);
CREATE INDEX idx_run_sub_user       ON run_subscription(user_id);
CREATE INDEX idx_run_sub_run        ON run_subscription(run_id);
CREATE INDEX idx_run_fav_user       ON run_favorite(user_id);
CREATE INDEX idx_block_blocker      ON user_block(blocker_id);
CREATE INDEX idx_block_blocked      ON user_block(blocked_id);
CREATE INDEX idx_comment_run        ON run_comment(run_id);
CREATE INDEX idx_comment_user       ON run_comment(user_id);
CREATE INDEX idx_comment_parent     ON run_comment(parent_comment_id) WHERE parent_comment_id IS NOT NULL;
CREATE INDEX idx_reaction_run       ON run_reaction(run_id);
CREATE INDEX idx_reaction_user      ON run_reaction(user_id);
CREATE INDEX idx_notification_user  ON notification(user_id);
CREATE INDEX idx_notification_read  ON notification(user_id, is_read) WHERE is_read = FALSE;
CREATE INDEX idx_notification_date  ON notification(created_at DESC);
CREATE INDEX idx_contrib_contributor ON community_contribution(contributor_id);
CREATE INDEX idx_contrib_game        ON community_contribution(game_id);
CREATE INDEX idx_contrib_status      ON community_contribution(status);
