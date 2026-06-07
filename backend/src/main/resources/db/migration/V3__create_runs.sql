-- ============================================================
-- V3 — Reglas, Runs, Encuentros, Pokémon capturados
-- ============================================================

-- ──────────────────────────────────────────────────────────
-- PRESETS DE REGLAS
-- ──────────────────────────────────────────────────────────

CREATE TABLE rule_preset (
    id          BIGSERIAL   PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    description TEXT,
    is_system   BOOLEAN     NOT NULL DEFAULT FALSE,       -- TRUE = preset predefinido (Clásico, Hardcore, Libre)
    owner_id    UUID        REFERENCES "user"(id)         -- NULL = preset del sistema
);

-- ──────────────────────────────────────────────────────────
-- RUNS
-- ──────────────────────────────────────────────────────────

CREATE TABLE run (
    id                      UUID        PRIMARY KEY,
    user_id                 UUID        NOT NULL REFERENCES "user"(id),
    game_id                 BIGINT      NOT NULL REFERENCES game(id),
    name                    VARCHAR(150) NOT NULL,
    slug                    VARCHAR(200) NOT NULL,
    game_version            VARCHAR(10),                  -- NULL si el juego no tiene versiones
    is_randomized           BOOLEAN     NOT NULL DEFAULT FALSE,
    status                  VARCHAR(15) NOT NULL DEFAULT 'ACTIVE'
        CHECK (status IN ('ACTIVE','COMPLETED','GAME_OVER','ABANDONED')),
    visibility              VARCHAR(20) NOT NULL DEFAULT 'PRIVATE'
        CHECK (visibility IN ('PUBLIC','FOLLOWERS_ONLY','PRIVATE')),
    event_visibility_config JSONB       NOT NULL DEFAULT '{
        "POKEMON_CAPTURED": true,
        "POKEMON_EVOLVED": true,
        "POKEMON_FAINTED": true,
        "BADGE_OBTAINED": true,
        "RUN_ENDED": true
    }'::jsonb,
    is_favorite             BOOLEAN     NOT NULL DEFAULT FALSE,
    display_order           INT         NOT NULL DEFAULT 0,
    base_preset_id          BIGINT      REFERENCES rule_preset(id),
    subscriber_count        INT         NOT NULL DEFAULT 0,
    last_activity_at        TIMESTAMPTZ,
    started_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at                TIMESTAMPTZ,
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at              TIMESTAMPTZ,                  -- soft delete para sync
    UNIQUE (user_id, slug)
);

CREATE TABLE run_rule (
    id          BIGSERIAL   PRIMARY KEY,
    run_id      UUID        NOT NULL REFERENCES run(id) ON DELETE CASCADE,
    rule_type   VARCHAR(30) NOT NULL CHECK (rule_type IN (
                    'FIRST_ENCOUNTER_ONLY','PERMADEATH','NICKNAME_REQUIRED',
                    'SPECIES_CLAUSE','DUPLICATE_CLAUSE','ITEM_CLAUSE',
                    'REGIONAL_VARIANT_CLAUSE','LEVEL_CAP','MAX_CATCHES_PER_ROUTE'
                )),
    is_enabled  BOOLEAN     NOT NULL DEFAULT TRUE,
    value       JSONB                                     -- NULL para reglas booleanas
);

CREATE TABLE run_badge (
    id           BIGSERIAL   PRIMARY KEY,
    run_id       UUID        NOT NULL REFERENCES run(id) ON DELETE CASCADE,
    badge_id     BIGINT      NOT NULL REFERENCES badge(id),
    obtained_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (run_id, badge_id)
);

-- ──────────────────────────────────────────────────────────
-- ENCUENTROS POR RUTA
-- ──────────────────────────────────────────────────────────

CREATE TABLE route_encounter (
    id              UUID        PRIMARY KEY,
    run_id          UUID        NOT NULL REFERENCES run(id) ON DELETE CASCADE,
    route_id        BIGINT      NOT NULL REFERENCES route(id),
    outcome         VARCHAR(25) NOT NULL DEFAULT 'PENDING'
        CHECK (outcome IN ('PENDING','DEFERRED','CAPTURED','FAILED','DIED_IN_ENCOUNTER','NOT_FOUND')),
    notes           TEXT,
    encountered_at  TIMESTAMPTZ,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ
);

-- ──────────────────────────────────────────────────────────
-- POKÉMON CAPTURADOS
-- ──────────────────────────────────────────────────────────

CREATE TABLE caught_pokemon (
    id                   UUID     PRIMARY KEY,
    run_id               UUID     NOT NULL REFERENCES run(id) ON DELETE CASCADE,
    route_encounter_id   UUID     NOT NULL REFERENCES route_encounter(id),
    original_pokemon_id  BIGINT   NOT NULL REFERENCES pokemon(id),  -- inmutable
    current_pokemon_id   BIGINT   NOT NULL REFERENCES pokemon(id),  -- cambia al evolucionar
    nickname             VARCHAR(50),
    is_shiny             BOOLEAN  NOT NULL DEFAULT FALSE,
    status               VARCHAR(10) NOT NULL DEFAULT 'ACTIVE'
        CHECK (status IN ('ACTIVE','BOXED','FAINTED')),
    caught_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE pokemon_status_log (
    id                BIGSERIAL   PRIMARY KEY,
    caught_pokemon_id UUID        NOT NULL REFERENCES caught_pokemon(id) ON DELETE CASCADE,
    status            VARCHAR(10) NOT NULL CHECK (status IN ('ACTIVE','BOXED','FAINTED')),
    occurred_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    notes             TEXT,                                -- contexto de muerte, etc.
    is_correction     BOOLEAN     NOT NULL DEFAULT FALSE   -- TRUE = corrección del jugador
);

-- ──────────────────────────────────────────────────────────
-- OVERRIDES DE STATS (ROM hacks)
-- ──────────────────────────────────────────────────────────

CREATE TABLE run_stat_override (
    id          BIGSERIAL PRIMARY KEY,
    run_id      UUID      NOT NULL REFERENCES run(id) ON DELETE CASCADE,
    pokemon_id  BIGINT    NOT NULL REFERENCES pokemon(id),
    hp          SMALLINT  NOT NULL,
    attack      SMALLINT  NOT NULL,
    defense     SMALLINT  NOT NULL,
    sp_atk      SMALLINT  NOT NULL,
    sp_def      SMALLINT  NOT NULL,
    speed       SMALLINT  NOT NULL,
    UNIQUE (run_id, pokemon_id)
);

-- ──────────────────────────────────────────────────────────
-- PRESETS DE CALCULADORA
-- ──────────────────────────────────────────────────────────

CREATE TABLE calc_preset (
    id            BIGSERIAL   PRIMARY KEY,
    run_id        UUID        NOT NULL REFERENCES run(id) ON DELETE CASCADE,
    name          VARCHAR(100) NOT NULL,
    pokemon_id    BIGINT      NOT NULL REFERENCES pokemon(id),
    form_variant  VARCHAR(50),
    level         SMALLINT    NOT NULL DEFAULT 50,
    ev_hp         SMALLINT    NOT NULL DEFAULT 0,
    ev_atk        SMALLINT    NOT NULL DEFAULT 0,
    ev_def        SMALLINT    NOT NULL DEFAULT 0,
    ev_sp_atk     SMALLINT    NOT NULL DEFAULT 0,
    ev_sp_def     SMALLINT    NOT NULL DEFAULT 0,
    ev_spe        SMALLINT    NOT NULL DEFAULT 0,
    iv_hp         SMALLINT    NOT NULL DEFAULT 31,
    iv_atk        SMALLINT    NOT NULL DEFAULT 31,
    iv_def        SMALLINT    NOT NULL DEFAULT 31,
    iv_sp_atk     SMALLINT    NOT NULL DEFAULT 31,
    iv_sp_def     SMALLINT    NOT NULL DEFAULT 31,
    iv_spe        SMALLINT    NOT NULL DEFAULT 31,
    nature        VARCHAR(20),
    ability_id    BIGINT      REFERENCES ability(id),
    item_id       BIGINT      REFERENCES item(id),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ──────────────────────────────────────────────────────────
-- EVENTOS DE RUN (append-only)
-- ──────────────────────────────────────────────────────────

CREATE TABLE run_event (
    id          BIGSERIAL   PRIMARY KEY,
    run_id      UUID        NOT NULL REFERENCES run(id) ON DELETE CASCADE,
    event_type  VARCHAR(30) NOT NULL CHECK (event_type IN (
                    'POKEMON_CAPTURED','POKEMON_EVOLVED','POKEMON_FAINTED',
                    'BADGE_OBTAINED','RUN_ENDED'
                )),
    payload     JSONB       NOT NULL,
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ──────────────────────────────────────────────────────────
-- ÍNDICES
-- ──────────────────────────────────────────────────────────

CREATE INDEX idx_run_user           ON run(user_id);
CREATE INDEX idx_run_game           ON run(game_id);
CREATE INDEX idx_run_status         ON run(status);
CREATE INDEX idx_run_visibility     ON run(visibility);
CREATE INDEX idx_run_deleted        ON run(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX idx_run_last_activity  ON run(last_activity_at DESC);
CREATE INDEX idx_run_rule_run       ON run_rule(run_id);
CREATE INDEX idx_run_badge_run      ON run_badge(run_id);
CREATE INDEX idx_route_encounter_run    ON route_encounter(run_id);
CREATE INDEX idx_route_encounter_route  ON route_encounter(route_id);
CREATE INDEX idx_caught_pokemon_run     ON caught_pokemon(run_id);
CREATE INDEX idx_caught_pokemon_status  ON caught_pokemon(status);
CREATE INDEX idx_status_log_pokemon     ON pokemon_status_log(caught_pokemon_id);
CREATE INDEX idx_run_event_run          ON run_event(run_id);
CREATE INDEX idx_run_event_type         ON run_event(event_type);
CREATE INDEX idx_run_event_occurred     ON run_event(occurred_at DESC);

-- GIN para búsqueda de runs (full-text search)
CREATE INDEX idx_run_name_gin ON run USING GIN (to_tsvector('simple', name));
