-- ============================================================
-- V2 — Usuarios, Auth, Configuración
-- ============================================================

CREATE TABLE "user" (
    id                          UUID        PRIMARY KEY,
    email                       VARCHAR(255) NOT NULL UNIQUE,
    email_verified              BOOLEAN      NOT NULL DEFAULT FALSE,
    password_hash               VARCHAR(255),                        -- NULL si solo OAuth
    username                    VARCHAR(50)  NOT NULL UNIQUE,
    role                        VARCHAR(20)  NOT NULL DEFAULT 'USER'
        CHECK (role IN ('USER','CONTRIBUTOR','ADMIN')),
    is_verified                 BOOLEAN      NOT NULL DEFAULT FALSE, -- cuenta notable (streamer, etc.)
    last_username_changed_at    TIMESTAMPTZ,
    token_version               INT          NOT NULL DEFAULT 0,
    approved_contribution_count INT          NOT NULL DEFAULT 0,
    deleted_at                  TIMESTAMPTZ,
    deletion_reason             VARCHAR(30)  CHECK (deletion_reason IN ('self_requested','admin_ban')),
    created_at                  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at                  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE oauth_connection (
    id               BIGSERIAL   PRIMARY KEY,
    user_id          UUID        NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    provider         VARCHAR(30) NOT NULL,                           -- GOOGLE | YOUTUBE | TWITCH
    provider_user_id VARCHAR(255) NOT NULL,
    profile_data     JSONB,                                         -- foto, nombre del proveedor, etc.
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (provider, provider_user_id)
);

CREATE TABLE username_history (
    id           BIGSERIAL   PRIMARY KEY,
    user_id      UUID        NOT NULL REFERENCES "user"(id),
    old_username VARCHAR(50) NOT NULL,
    changed_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE email_verification_token (
    id          BIGSERIAL   PRIMARY KEY,
    user_id     UUID        NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    token_hash  VARCHAR(255) NOT NULL UNIQUE,
    expires_at  TIMESTAMPTZ  NOT NULL,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE password_reset_token (
    id          BIGSERIAL   PRIMARY KEY,
    user_id     UUID        NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    token_hash  VARCHAR(255) NOT NULL UNIQUE,
    expires_at  TIMESTAMPTZ  NOT NULL,
    used_at     TIMESTAMPTZ,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE refresh_token (
    id            BIGSERIAL   PRIMARY KEY,
    user_id       UUID        NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    token_hash    VARCHAR(255) NOT NULL UNIQUE,
    token_version INT         NOT NULL,                             -- debe coincidir con user.token_version
    expires_at    TIMESTAMPTZ  NOT NULL,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE user_settings (
    user_id                       UUID        PRIMARY KEY REFERENCES "user"(id) ON DELETE CASCADE,
    allow_followers               BOOLEAN     NOT NULL DEFAULT TRUE,
    language                      CHAR(2),                          -- NULL = usar idioma del navegador
    last_seen_notifications_at    TIMESTAMPTZ,
    notification_preferences      JSONB       NOT NULL DEFAULT '{
        "POKEMON_CAPTURED": true,
        "POKEMON_FAINTED": true,
        "POKEMON_EVOLVED": true,
        "BADGE_OBTAINED": true,
        "RUN_ENDED": true,
        "NEW_FOLLOWER": true,
        "NEW_COMMENT": true,
        "NEW_REACTION": true
    }'::jsonb
);

CREATE TABLE push_subscription (
    id          BIGSERIAL   PRIMARY KEY,
    user_id     UUID        NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    endpoint    TEXT        NOT NULL,
    p256dh      TEXT        NOT NULL,
    auth        TEXT        NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ──────────────────────────────────────────────────────────
-- ÍNDICES
-- ──────────────────────────────────────────────────────────

CREATE INDEX idx_user_email            ON "user"(email);
CREATE INDEX idx_user_username         ON "user"(username);
CREATE INDEX idx_user_deleted          ON "user"(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX idx_oauth_user            ON oauth_connection(user_id);
CREATE INDEX idx_username_history_user ON username_history(user_id);
CREATE INDEX idx_refresh_token_user    ON refresh_token(user_id);
CREATE INDEX idx_push_sub_user         ON push_subscription(user_id);

-- GIN para búsqueda de usuarios (full-text search)
CREATE INDEX idx_user_username_gin ON "user" USING GIN (to_tsvector('simple', username));
