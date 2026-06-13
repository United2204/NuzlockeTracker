-- Localización de nombres de rutas y lugares, mismo patrón que pokemon_name.
-- El nombre en inglés vive en route.name; esta tabla agrega traducciones.
-- El endpoint resuelve el nombre en el idioma pedido y cae a route.name si no existe.

CREATE TABLE route_name (
    route_id BIGINT       NOT NULL REFERENCES route(id) ON DELETE CASCADE,
    lang     VARCHAR(2)   NOT NULL,                 -- ISO 639-1: "es", "en", ...
    name     VARCHAR(150) NOT NULL,
    PRIMARY KEY (route_id, lang)
);

CREATE INDEX idx_route_name_route ON route_name(route_id);

-- ── Español ──────────────────────────────────────────────────────────────
-- Rutas numeradas: "Route N" → "Ruta N" (ambos juegos). El sufijo Desert se trata aparte.
INSERT INTO route_name (route_id, lang, name)
SELECT id, 'es', REPLACE(name, 'Route ', 'Ruta ')
FROM route
WHERE name LIKE 'Route %' AND name NOT LIKE '%Desert%';

-- Lugares con nombre propio (nombres oficiales en español de los juegos).
INSERT INTO route_name (route_id, lang, name)
SELECT r.id, 'es', t.es
FROM route r
JOIN game g ON g.id = r.game_id
JOIN (VALUES
    ('Pokémon ORAS', 'Littleroot Town',  'Villa Raíz'),
    ('Pokémon ORAS', 'Petalburg Woods',  'Bosque Petalia'),
    ('Pokémon ORAS', 'Rusturf Tunnel',   'Túnel Fervergal'),
    ('Pokémon ORAS', 'Granite Cave',     'Cueva Granito'),
    ('Pokémon ORAS', 'Fiery Path',       'Senda Ígnea'),
    ('Pokémon ORAS', 'Meteor Falls',     'Cascada Meteoro'),
    ('Pokémon ORAS', 'Route 111 Desert', 'Ruta 111 (Desierto)'),
    ('Pokémon ORAS', 'Safari Zone',      'Zona Safari'),
    ('Pokémon ORAS', 'Mt. Pyre',         'Monte Pírico'),
    ('Pokémon ORAS', 'Shoal Cave',       'Cueva Cardumen'),
    ('Pokémon ORAS', 'New Mauville',     'Malvalanova'),
    ('Pokémon ORAS', 'Seafloor Cavern',  'Caverna Abisal'),
    ('Pokémon ORAS', 'Cave of Origin',   'Cueva Ancestral'),
    ('Pokémon ORAS', 'Victory Road',     'Calle Victoria'),
    ('Pokémon X/Y',  'Vaniville Town',   'Pueblo Boceto'),
    ('Pokémon X/Y',  'Santalune Forest', 'Bosque de Novarte'),
    ('Pokémon X/Y',  'Parfum Palace',    'Palacio Cénit'),
    ('Pokémon X/Y',  'Connecting Cave',  'Gruta Tierraunida'),
    ('Pokémon X/Y',  'Victory Road',     'Calle Victoria')
) AS t(game, en, es) ON g.name = t.game AND r.name = t.en;
