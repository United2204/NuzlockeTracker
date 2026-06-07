-- ============================================================
-- V7 — Datos de juego: Pokémon X/Y y Pokémon ORAS
-- Incluye: games, badges, gyms y rutas con required_badge
-- Niveles del gym ace = base para el cálculo de level cap.
-- ============================================================

DO $$
DECLARE
    -- X/Y IDs
    xy          BIGINT;
    xy_bug      BIGINT;  -- Bug Badge     (Viola)
    xy_cliff    BIGINT;  -- Cliff Badge   (Grant)
    xy_rumble   BIGINT;  -- Rumble Badge  (Korrina)
    xy_plant    BIGINT;  -- Plant Badge   (Ramos)
    xy_voltage  BIGINT;  -- Voltage Badge (Clemont)
    xy_fairy    BIGINT;  -- Fairy Badge   (Valerie)
    xy_psychic  BIGINT;  -- Psychic Badge (Olympia)
    xy_iceberg  BIGINT;  -- Iceberg Badge (Wulfric)

    -- ORAS IDs
    oras        BIGINT;
    or_stone    BIGINT;  -- Stone Badge   (Roxanne)
    or_knuckle  BIGINT;  -- Knuckle Badge (Brawly)
    or_dynamo   BIGINT;  -- Dynamo Badge  (Wattson)
    or_heat     BIGINT;  -- Heat Badge    (Flannery)
    or_balance  BIGINT;  -- Balance Badge (Norman)
    or_feather  BIGINT;  -- Feather Badge (Winona)
    or_mind     BIGINT;  -- Mind Badge    (Tate & Liza)
    or_rain     BIGINT;  -- Rain Badge    (Wallace)

BEGIN

-- ──────────────────────────────────────────────────────────
-- POKÉMON X/Y
-- ──────────────────────────────────────────────────────────

INSERT INTO game (name, generation, is_official, versions)
VALUES ('Pokémon X/Y', 6, TRUE, '["X","Y"]')
RETURNING id INTO xy;

-- Badges
INSERT INTO badge (game_id, name, display_order) VALUES (xy, 'Bug Badge',     1) RETURNING id INTO xy_bug;
INSERT INTO badge (game_id, name, display_order) VALUES (xy, 'Cliff Badge',   2) RETURNING id INTO xy_cliff;
INSERT INTO badge (game_id, name, display_order) VALUES (xy, 'Rumble Badge',  3) RETURNING id INTO xy_rumble;
INSERT INTO badge (game_id, name, display_order) VALUES (xy, 'Plant Badge',   4) RETURNING id INTO xy_plant;
INSERT INTO badge (game_id, name, display_order) VALUES (xy, 'Voltage Badge', 5) RETURNING id INTO xy_voltage;
INSERT INTO badge (game_id, name, display_order) VALUES (xy, 'Fairy Badge',   6) RETURNING id INTO xy_fairy;
INSERT INTO badge (game_id, name, display_order) VALUES (xy, 'Psychic Badge', 7) RETURNING id INTO xy_psychic;
INSERT INTO badge (game_id, name, display_order) VALUES (xy, 'Iceberg Badge', 8) RETURNING id INTO xy_iceberg;

-- Gyms (ace_pokemon_level = nivel del as del líder → base del level cap)
INSERT INTO gym (game_id, badge_id, leader_name, display_order, ace_pokemon_level) VALUES
    (xy, xy_bug,     'Viola',   1, 12),
    (xy, xy_cliff,   'Grant',   2, 25),
    (xy, xy_rumble,  'Korrina', 3, 32),
    (xy, xy_plant,   'Ramos',   4, 44),
    (xy, xy_voltage, 'Clemont', 5, 37),
    (xy, xy_fairy,   'Valerie', 6, 42),
    (xy, xy_psychic, 'Olympia', 7, 48),
    (xy, xy_iceberg, 'Wulfric', 8, 59);

-- Rutas X/Y (orden narrativo de la historia)
-- Sin medalla requerida (inicio del juego)
INSERT INTO route (game_id, name, display_order, required_badge_id, encounter_type) VALUES
    (xy, 'Vaniville Town',    1,  NULL,       'STARTER'),
    (xy, 'Route 1',           2,  NULL,       'RANDOM'),
    (xy, 'Route 2',           3,  NULL,       'RANDOM'),
    (xy, 'Santalune Forest',  4,  NULL,       'RANDOM'),
    (xy, 'Route 3',           5,  NULL,       'RANDOM'),
    (xy, 'Route 22',          6,  NULL,       'RANDOM');

-- Después de Bug Badge (Viola)
INSERT INTO route (game_id, name, display_order, required_badge_id, encounter_type) VALUES
    (xy, 'Route 4',         7,  xy_bug, 'RANDOM'),
    (xy, 'Route 5',         8,  xy_bug, 'RANDOM'),
    (xy, 'Route 6',         9,  xy_bug, 'RANDOM'),
    (xy, 'Parfum Palace',   10, xy_bug, 'RANDOM'),
    (xy, 'Route 7',         11, xy_bug, 'RANDOM'),
    (xy, 'Connecting Cave', 12, xy_bug, 'RANDOM'),
    (xy, 'Route 8',         13, xy_bug, 'RANDOM'),
    (xy, 'Route 9',         14, xy_bug, 'RANDOM'),
    (xy, 'Glittering Cave', 15, xy_bug, 'RANDOM');

-- Después de Cliff Badge (Grant)
INSERT INTO route (game_id, name, display_order, required_badge_id, encounter_type) VALUES
    (xy, 'Route 10',       16, xy_cliff, 'RANDOM'),
    (xy, 'Route 11',       17, xy_cliff, 'RANDOM'),
    (xy, 'Reflection Cave',18, xy_cliff, 'RANDOM');

-- Después de Rumble Badge (Korrina)
INSERT INTO route (game_id, name, display_order, required_badge_id, encounter_type) VALUES
    (xy, 'Route 12',   19, xy_rumble, 'RANDOM'),
    (xy, 'Azure Bay',  20, xy_rumble, 'RANDOM');

-- Después de Plant Badge (Ramos)
INSERT INTO route (game_id, name, display_order, required_badge_id, encounter_type) VALUES
    (xy, 'Route 13',   21, xy_plant, 'RANDOM');

-- Después de Voltage Badge (Clemont)
INSERT INTO route (game_id, name, display_order, required_badge_id, encounter_type) VALUES
    (xy, 'Route 14',   22, xy_voltage, 'RANDOM'),
    (xy, 'Route 15',   23, xy_voltage, 'RANDOM'),
    (xy, 'Route 16',   24, xy_voltage, 'RANDOM'),
    (xy, 'Lost Hotel', 25, xy_voltage, 'RANDOM');

-- Después de Fairy Badge (Valerie)
INSERT INTO route (game_id, name, display_order, required_badge_id, encounter_type) VALUES
    (xy, 'Route 17',           26, xy_fairy, 'RANDOM'),
    (xy, 'Route 18',           27, xy_fairy, 'RANDOM'),
    (xy, 'Route 19',           28, xy_fairy, 'RANDOM'),
    (xy, 'Pokémon Village',    29, xy_fairy, 'RANDOM');

-- Después de Psychic Badge (Olympia)
INSERT INTO route (game_id, name, display_order, required_badge_id, encounter_type) VALUES
    (xy, 'Route 21',      30, xy_psychic, 'RANDOM');

-- Después de Iceberg Badge (Wulfric)
INSERT INTO route (game_id, name, display_order, required_badge_id, encounter_type) VALUES
    (xy, 'Victory Road',  31, xy_iceberg, 'RANDOM');


-- ──────────────────────────────────────────────────────────
-- POKÉMON OMEGA RUBY / ALPHA SAPPHIRE (ORAS)
-- ──────────────────────────────────────────────────────────

INSERT INTO game (name, generation, is_official, versions)
VALUES ('Pokémon ORAS', 6, TRUE, '["OR","AS"]')
RETURNING id INTO oras;

-- Badges
INSERT INTO badge (game_id, name, display_order) VALUES (oras, 'Stone Badge',   1) RETURNING id INTO or_stone;
INSERT INTO badge (game_id, name, display_order) VALUES (oras, 'Knuckle Badge', 2) RETURNING id INTO or_knuckle;
INSERT INTO badge (game_id, name, display_order) VALUES (oras, 'Dynamo Badge',  3) RETURNING id INTO or_dynamo;
INSERT INTO badge (game_id, name, display_order) VALUES (oras, 'Heat Badge',    4) RETURNING id INTO or_heat;
INSERT INTO badge (game_id, name, display_order) VALUES (oras, 'Balance Badge', 5) RETURNING id INTO or_balance;
INSERT INTO badge (game_id, name, display_order) VALUES (oras, 'Feather Badge', 6) RETURNING id INTO or_feather;
INSERT INTO badge (game_id, name, display_order) VALUES (oras, 'Mind Badge',    7) RETURNING id INTO or_mind;
INSERT INTO badge (game_id, name, display_order) VALUES (oras, 'Rain Badge',    8) RETURNING id INTO or_rain;

-- Gyms
INSERT INTO gym (game_id, badge_id, leader_name, display_order, ace_pokemon_level) VALUES
    (oras, or_stone,   'Roxanne',   1, 15),
    (oras, or_knuckle, 'Brawly',    2, 19),
    (oras, or_dynamo,  'Wattson',   3, 24),
    (oras, or_heat,    'Flannery',  4, 29),
    (oras, or_balance, 'Norman',    5, 31),
    (oras, or_feather, 'Winona',    6, 38),
    (oras, or_mind,    'Tate & Liza', 7, 45),
    (oras, or_rain,    'Wallace',   8, 50);

-- Rutas ORAS (orden narrativo Hoenn)
-- Sin medalla requerida
INSERT INTO route (game_id, name, display_order, required_badge_id, encounter_type) VALUES
    (oras, 'Littleroot Town', 1,  NULL, 'STARTER'),
    (oras, 'Route 101',       2,  NULL, 'RANDOM'),
    (oras, 'Route 102',       3,  NULL, 'RANDOM'),
    (oras, 'Route 103',       4,  NULL, 'RANDOM'),
    (oras, 'Petalburg Woods', 5,  NULL, 'RANDOM'),
    (oras, 'Route 104',       6,  NULL, 'RANDOM'),
    (oras, 'Route 116',       7,  NULL, 'RANDOM'),
    (oras, 'Rusturf Tunnel',  8,  NULL, 'RANDOM');

-- Después de Stone Badge (Roxanne)
INSERT INTO route (game_id, name, display_order, required_badge_id, encounter_type) VALUES
    (oras, 'Route 106',    9,  or_stone, 'RANDOM'),
    (oras, 'Granite Cave', 10, or_stone, 'RANDOM'),
    (oras, 'Route 107',    11, or_stone, 'RANDOM'),
    (oras, 'Route 108',    12, or_stone, 'RANDOM'),
    (oras, 'Route 109',    13, or_stone, 'RANDOM');

-- Después de Knuckle Badge (Brawly)
INSERT INTO route (game_id, name, display_order, required_badge_id, encounter_type) VALUES
    (oras, 'Route 110',    14, or_knuckle, 'RANDOM'),
    (oras, 'Route 117',    15, or_knuckle, 'RANDOM');

-- Después de Dynamo Badge (Wattson)
INSERT INTO route (game_id, name, display_order, required_badge_id, encounter_type) VALUES
    (oras, 'Route 118',       16, or_dynamo, 'RANDOM'),
    (oras, 'Route 111',       17, or_dynamo, 'RANDOM'),
    (oras, 'Fiery Path',      18, or_dynamo, 'RANDOM'),
    (oras, 'Route 112',       19, or_dynamo, 'RANDOM'),
    (oras, 'Route 113',       20, or_dynamo, 'RANDOM'),
    (oras, 'Route 114',       21, or_dynamo, 'RANDOM'),
    (oras, 'Meteor Falls',    22, or_dynamo, 'RANDOM'),
    (oras, 'Route 115',       23, or_dynamo, 'RANDOM');

-- Después de Heat Badge (Flannery) — Go-Goggles para el desierto
INSERT INTO route (game_id, name, display_order, required_badge_id, encounter_type) VALUES
    (oras, 'Route 111 Desert', 24, or_heat, 'RANDOM');

-- Después de Balance Badge (Norman)
INSERT INTO route (game_id, name, display_order, required_badge_id, encounter_type) VALUES
    (oras, 'Route 119',    25, or_balance, 'RANDOM'),
    (oras, 'Route 120',    26, or_balance, 'RANDOM'),
    (oras, 'Route 121',    27, or_balance, 'RANDOM'),
    (oras, 'Safari Zone',  28, or_balance, 'RANDOM'),
    (oras, 'Mt. Pyre',     29, or_balance, 'RANDOM'),
    (oras, 'Route 122',    30, or_balance, 'RANDOM'),
    (oras, 'Route 123',    31, or_balance, 'RANDOM');

-- Después de Feather Badge (Winona)
INSERT INTO route (game_id, name, display_order, required_badge_id, encounter_type) VALUES
    (oras, 'Route 124',       32, or_feather, 'RANDOM'),
    (oras, 'Shoal Cave',      33, or_feather, 'RANDOM'),
    (oras, 'Route 125',       34, or_feather, 'RANDOM'),
    (oras, 'Route 126',       35, or_feather, 'RANDOM'),
    (oras, 'Route 127',       36, or_feather, 'RANDOM'),
    (oras, 'New Mauville',    37, or_feather, 'RANDOM');

-- Después de Mind Badge (Tate & Liza)
INSERT INTO route (game_id, name, display_order, required_badge_id, encounter_type) VALUES
    (oras, 'Route 128',       38, or_mind, 'RANDOM'),
    (oras, 'Seafloor Cavern', 39, or_mind, 'RANDOM'),
    (oras, 'Cave of Origin',  40, or_mind, 'STATIC'),
    (oras, 'Route 129',       41, or_mind, 'RANDOM'),
    (oras, 'Route 130',       42, or_mind, 'RANDOM'),
    (oras, 'Route 131',       43, or_mind, 'RANDOM');

-- Después de Rain Badge (Wallace)
INSERT INTO route (game_id, name, display_order, required_badge_id, encounter_type) VALUES
    (oras, 'Victory Road',    44, or_rain, 'RANDOM');

END $$;
