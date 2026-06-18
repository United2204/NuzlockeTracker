-- Agrega Ciudad Portuaria (Slateport City) para ORAS.
-- Tiene pesca (RANDOM). Va entre Route 109 y Route 110, después de Knuckle Badge.
-- Orden actual tras V24: Route 109 = 15, Route 110 = 16.
DO $$
DECLARE
  oras_id     BIGINT;
  or_knuckle  BIGINT;
  rid         BIGINT;
BEGIN
  SELECT id INTO oras_id    FROM game  WHERE name = 'Pokémon ORAS';
  SELECT id INTO or_knuckle FROM badge WHERE game_id = oras_id AND name = 'Knuckle Badge';

  UPDATE route SET display_order = display_order + 1
  WHERE game_id = oras_id AND display_order >= 16;

  INSERT INTO route (game_id, name, display_order, required_badge_id, encounter_type)
  VALUES (oras_id, 'Slateport City', 16, or_knuckle, 'RANDOM')
  RETURNING id INTO rid;

  INSERT INTO route_name (route_id, lang, name)
  VALUES (rid, 'es', 'Ciudad Portuaria');
END $$;
