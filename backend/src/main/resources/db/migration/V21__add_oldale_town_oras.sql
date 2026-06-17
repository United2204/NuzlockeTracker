-- Agrega Pueblo Azuliza (Oldale Town) para ORAS.
-- Tiene encuentros de pesca (RANDOM). Va entre Route 101 (order 2) y Route 102.
DO $$
DECLARE
  oras_id  BIGINT;
  route_id BIGINT;
BEGIN
  SELECT id INTO oras_id FROM game WHERE name = 'Pokémon ORAS';

  -- Desplaza todas las rutas ORAS con order >= 3 para hacer lugar
  UPDATE route
  SET display_order = display_order + 1
  WHERE game_id = oras_id AND display_order >= 3;

  -- Inserta Oldale Town en order 3 (sin medalla requerida)
  INSERT INTO route (game_id, name, display_order, required_badge_id, encounter_type)
  VALUES (oras_id, 'Oldale Town', 3, NULL, 'RANDOM')
  RETURNING id INTO route_id;

  -- Nombre en español
  INSERT INTO route_name (route_id, lang, name)
  VALUES (route_id, 'es', 'Pueblo Azuliza');
END $$;
