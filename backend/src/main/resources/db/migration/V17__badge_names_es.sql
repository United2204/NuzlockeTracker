-- V17 — Tabla de localización de medallas + nombres en español (X/Y y ORAS)

CREATE TABLE badge_name (
    badge_id  BIGINT      NOT NULL REFERENCES badge(id),
    lang      VARCHAR(2)  NOT NULL,
    name      VARCHAR(100) NOT NULL,
    PRIMARY KEY (badge_id, lang)
);

CREATE INDEX idx_badge_name_badge ON badge_name(badge_id);

-- Nombres oficiales en español para X/Y y ORAS
INSERT INTO badge_name (badge_id, lang, name)
SELECT b.id, 'es',
    CASE b.name
        WHEN 'Bug Badge'     THEN 'Medalla Insecto'
        WHEN 'Cliff Badge'   THEN 'Medalla Risco'
        WHEN 'Rumble Badge'  THEN 'Medalla Combate'
        WHEN 'Plant Badge'   THEN 'Medalla Planta'
        WHEN 'Voltage Badge' THEN 'Medalla Voltaje'
        WHEN 'Fairy Badge'   THEN 'Medalla Hada'
        WHEN 'Psychic Badge' THEN 'Medalla Psíquica'
        WHEN 'Iceberg Badge' THEN 'Medalla Témpano'
        WHEN 'Stone Badge'   THEN 'Medalla Roca'
        WHEN 'Knuckle Badge' THEN 'Medalla Puño'
        WHEN 'Dynamo Badge'  THEN 'Medalla Dínamo'
        WHEN 'Heat Badge'    THEN 'Medalla Calor'
        WHEN 'Balance Badge' THEN 'Medalla Equilibrio'
        WHEN 'Feather Badge' THEN 'Medalla Pluma'
        WHEN 'Mind Badge'    THEN 'Medalla Mente'
        WHEN 'Rain Badge'    THEN 'Medalla Lluvia'
    END
FROM badge b
WHERE b.name IN (
    'Bug Badge', 'Cliff Badge', 'Rumble Badge', 'Plant Badge',
    'Voltage Badge', 'Fairy Badge', 'Psychic Badge', 'Iceberg Badge',
    'Stone Badge', 'Knuckle Badge', 'Dynamo Badge', 'Heat Badge',
    'Balance Badge', 'Feather Badge', 'Mind Badge', 'Rain Badge'
);
