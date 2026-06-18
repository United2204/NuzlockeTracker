-- Agrega Ciudad Petalia (Petalburg City) para ORAS.
-- Tiene lago con pesca (RANDOM). Va entre Route 102 (order 4) y Route 104 (order 5).
DO $$
DECLARE
  oras_id  BIGINT;
  rid      BIGINT;
BEGIN
  SELECT id INTO oras_id FROM game WHERE name = 'Pokémon ORAS';

  UPDATE route SET display_order = display_order + 1
  WHERE game_id = oras_id AND display_order >= 5;

  INSERT INTO route (game_id, name, display_order, required_badge_id, encounter_type)
  VALUES (oras_id, 'Petalburg City', 5, NULL, 'RANDOM')
  RETURNING id INTO rid;

  INSERT INTO route_name (route_id, lang, name)
  VALUES (rid, 'es', 'Ciudad Petalia');
END $$;
