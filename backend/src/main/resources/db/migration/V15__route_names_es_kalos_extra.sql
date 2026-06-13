-- Nombres en español de lugares de Kalos (XY) que faltaban en V14.

INSERT INTO route_name (route_id, lang, name)
SELECT r.id, 'es', t.es
FROM route r
JOIN game g ON g.id = r.game_id
JOIN (VALUES
    ('Pokémon X/Y', 'Glittering Cave',  'Cueva Brillante'),
    ('Pokémon X/Y', 'Reflection Cave',  'Cueva de los Reflejos'),
    ('Pokémon X/Y', 'Azure Bay',        'Bahía Azul'),
    ('Pokémon X/Y', 'Lost Hotel',       'Hotel Desolación'),
    ('Pokémon X/Y', 'Pokémon Village',  'Villa Pokémon')
) AS t(game, en, es) ON g.name = t.game AND r.name = t.en;
