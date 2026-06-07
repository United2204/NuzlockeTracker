-- ============================================================
-- V1 — Catálogo (solo lectura para el usuario)
-- Pokémon, juegos, rutas, movimientos, habilidades, items
-- ============================================================

-- ──────────────────────────────────────────────────────────
-- GAMES
-- ──────────────────────────────────────────────────────────

CREATE TABLE game (
    id          BIGSERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    generation  SMALLINT     NOT NULL,
    is_official BOOLEAN      NOT NULL DEFAULT TRUE,
    versions    JSONB,                          -- ej: ["X","Y"] o ["OR","AS"]. NULL = sin versiones
    cover_image_url VARCHAR(500)
);

CREATE TABLE badge (
    id          BIGSERIAL PRIMARY KEY,
    game_id     BIGINT       NOT NULL REFERENCES game(id),
    name        VARCHAR(100) NOT NULL,
    display_order SMALLINT   NOT NULL,
    image_url   VARCHAR(500)
);

CREATE TABLE gym (
    id                 BIGSERIAL PRIMARY KEY,
    game_id            BIGINT      NOT NULL REFERENCES game(id),
    badge_id           BIGINT      NOT NULL REFERENCES badge(id),
    leader_name        VARCHAR(100) NOT NULL,
    display_order      SMALLINT    NOT NULL,
    ace_pokemon_level  SMALLINT    NOT NULL
);

CREATE TABLE route (
    id               BIGSERIAL PRIMARY KEY,
    game_id          BIGINT       NOT NULL REFERENCES game(id),
    name             VARCHAR(150) NOT NULL,
    display_order    SMALLINT     NOT NULL,
    required_badge_id BIGINT      REFERENCES badge(id),   -- NULL = disponible desde el inicio
    encounter_type   VARCHAR(30)  NOT NULL                -- RANDOM | STATIC | GIFT | STARTER | FOSSIL | LEGENDARY | TRADE
        CHECK (encounter_type IN ('RANDOM','STATIC','GIFT','STARTER','FOSSIL','LEGENDARY','TRADE'))
);

-- ──────────────────────────────────────────────────────────
-- POKÉMON
-- ──────────────────────────────────────────────────────────

CREATE TABLE pokemon (
    id                    BIGSERIAL PRIMARY KEY,
    species_id            BIGINT      NOT NULL,            -- agrupa variantes del mismo Pokémon
    national_dex_number   SMALLINT,                       -- NULL en fangames sin número nacional
    types                 JSONB        NOT NULL,           -- ej: ["WATER","ICE"]
    sprite_url            VARCHAR(500),
    variant               VARCHAR(50),                    -- NULL = forma base; "ALOLA","GALAR","HISUI"…
    is_from_fangame       BOOLEAN      NOT NULL DEFAULT FALSE,
    game_id               BIGINT       REFERENCES game(id) -- NULL para Pokémon oficiales
);

CREATE TABLE pokemon_name (
    pokemon_id  BIGINT       NOT NULL REFERENCES pokemon(id),
    lang        CHAR(2)      NOT NULL,                    -- ISO 639-1: "en", "es"
    name        VARCHAR(100) NOT NULL,
    PRIMARY KEY (pokemon_id, lang)
);

CREATE TABLE pokemon_evolution_chain (
    chain_id    BIGINT  NOT NULL,
    pokemon_id  BIGINT  NOT NULL REFERENCES pokemon(id),
    PRIMARY KEY (chain_id, pokemon_id)
);

CREATE TABLE pokemon_base_stats (
    pokemon_id  BIGINT   NOT NULL PRIMARY KEY REFERENCES pokemon(id),
    hp          SMALLINT NOT NULL,
    attack      SMALLINT NOT NULL,
    defense     SMALLINT NOT NULL,
    sp_atk      SMALLINT NOT NULL,
    sp_def      SMALLINT NOT NULL,
    speed       SMALLINT NOT NULL
);

-- ──────────────────────────────────────────────────────────
-- HABILIDADES
-- ──────────────────────────────────────────────────────────

CREATE TABLE ability (
    id  BIGSERIAL PRIMARY KEY
);

CREATE TABLE ability_name (
    ability_id  BIGINT   NOT NULL REFERENCES ability(id),
    lang        CHAR(2)  NOT NULL,
    name        VARCHAR(100) NOT NULL,
    PRIMARY KEY (ability_id, lang)
);

CREATE TABLE pokemon_ability (
    pokemon_id  BIGINT      NOT NULL REFERENCES pokemon(id),
    ability_id  BIGINT      NOT NULL REFERENCES ability(id),
    slot        VARCHAR(10) NOT NULL CHECK (slot IN ('1','2','HIDDEN')),
    PRIMARY KEY (pokemon_id, ability_id)
);

-- ──────────────────────────────────────────────────────────
-- MOVIMIENTOS
-- ──────────────────────────────────────────────────────────

CREATE TABLE move (
    id          BIGSERIAL PRIMARY KEY,
    type        VARCHAR(20)  NOT NULL,                    -- PokémonType enum
    power       SMALLINT,                                 -- NULL en moves de status
    category    VARCHAR(10)  NOT NULL CHECK (category IN ('PHYSICAL','SPECIAL','STATUS')),
    accuracy    SMALLINT,                                 -- NULL = never misses
    priority    SMALLINT     NOT NULL DEFAULT 0
);

CREATE TABLE move_name (
    move_id     BIGINT       NOT NULL REFERENCES move(id),
    lang        CHAR(2)      NOT NULL,
    name        VARCHAR(100) NOT NULL,
    PRIMARY KEY (move_id, lang)
);

CREATE TABLE pokemon_learnset (
    pokemon_id    BIGINT      NOT NULL REFERENCES pokemon(id),
    move_id       BIGINT      NOT NULL REFERENCES move(id),
    learn_method  VARCHAR(10) NOT NULL CHECK (learn_method IN ('LEVEL_UP','TM','HM','TUTOR','EGG')),
    level_learned SMALLINT,                               -- solo LEVEL_UP
    game_id       BIGINT      REFERENCES game(id),        -- NULL = aplica a todos los juegos
    PRIMARY KEY (pokemon_id, move_id, learn_method)
);

-- ──────────────────────────────────────────────────────────
-- EFECTIVIDAD DE TIPOS
-- ──────────────────────────────────────────────────────────

CREATE TABLE type_effectiveness (
    attacking_type  VARCHAR(20) NOT NULL,
    defending_type  VARCHAR(20) NOT NULL,
    multiplier      NUMERIC(4,2) NOT NULL,               -- 0 / 0.5 / 1 / 2
    PRIMARY KEY (attacking_type, defending_type)
);

-- ──────────────────────────────────────────────────────────
-- ITEMS
-- ──────────────────────────────────────────────────────────

CREATE TABLE item (
    id  BIGSERIAL PRIMARY KEY
);

CREATE TABLE item_name (
    item_id     BIGINT       NOT NULL REFERENCES item(id),
    lang        CHAR(2)      NOT NULL,
    name        VARCHAR(100) NOT NULL,
    PRIMARY KEY (item_id, lang)
);

CREATE TABLE item_calc_effect (
    id           BIGSERIAL PRIMARY KEY,
    item_id      BIGINT  NOT NULL REFERENCES item(id),
    effect_json  JSONB   NOT NULL
    -- ej: { "attackMultiplier": 1.5 }
    -- ej: { "damageMultiplier": 1.3, "condition": { "moveType": "FIRE" } }
);

-- ──────────────────────────────────────────────────────────
-- TABLAS DE ENCUENTRO POR RUTA
-- ──────────────────────────────────────────────────────────

CREATE TABLE route_encounter_table (
    id              BIGSERIAL PRIMARY KEY,
    route_id        BIGINT      NOT NULL REFERENCES route(id),
    pokemon_id      BIGINT      NOT NULL REFERENCES pokemon(id),
    encounter_type  VARCHAR(30) NOT NULL
        CHECK (encounter_type IN ('RANDOM','STATIC','GIFT','STARTER','FOSSIL','LEGENDARY','TRADE')),
    rarity          SMALLINT,                             -- porcentaje de aparición; NULL en no-RANDOM
    game_version    VARCHAR(10)                           -- NULL = todas las versiones; "X","Y","OR","AS"…
);

-- ──────────────────────────────────────────────────────────
-- ÍNDICES
-- ──────────────────────────────────────────────────────────

CREATE INDEX idx_badge_game           ON badge(game_id);
CREATE INDEX idx_gym_game             ON gym(game_id);
CREATE INDEX idx_route_game           ON route(game_id);
CREATE INDEX idx_route_required_badge ON route(required_badge_id);
CREATE INDEX idx_pokemon_species      ON pokemon(species_id);
CREATE INDEX idx_pokemon_dex          ON pokemon(national_dex_number);
CREATE INDEX idx_pokemon_game         ON pokemon(game_id);
CREATE INDEX idx_pec_chain            ON pokemon_evolution_chain(chain_id);
CREATE INDEX idx_learnset_move        ON pokemon_learnset(move_id);
CREATE INDEX idx_ret_route            ON route_encounter_table(route_id);
CREATE INDEX idx_ret_pokemon          ON route_encounter_table(pokemon_id);

-- GIN para búsqueda de nombres de Pokémon (full-text search)
CREATE INDEX idx_pokemon_name_gin ON pokemon_name USING GIN (to_tsvector('simple', name));
