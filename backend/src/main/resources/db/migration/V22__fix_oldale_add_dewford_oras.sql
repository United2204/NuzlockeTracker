-- V21 agregó Oldale Town por error. Este script lo elimina y agrega
-- Dewford Town (Pueblo Azuliza) en su lugar correcto: entre Route 106 y Granite Cave,
-- después de Stone Badge (2da medalla / Brawly).
DO $$
DECLARE
  oras_id     BIGINT;
  or_stone_id BIGINT;
  new_route   BIGINT;
BEGIN
  SELECT id INTO oras_id    FROM game  WHERE name = 'Pokémon ORAS';
  SELECT id INTO or_stone_id FROM badge WHERE game_id = oras_id AND name = 'Stone Badge';

  -- 1. Eliminar la ruta incorrecta (route_name se borra en cascada)
  DELETE FROM route WHERE game_id = oras_id AND name = 'Oldale Town';

  -- 2. Deshacer el shift que hizo V21 (restar 1 a todas las rutas que desplazó)
  UPDATE route SET display_order = display_order - 1
  WHERE game_id = oras_id AND display_order >= 4;

  -- Estado actual restaurado:  Route 106 = 9, Granite Cave = 10, ...

  -- 3. Hacer lugar para Dewford Town entre Route 106 (9) y Granite Cave (10)
  UPDATE route SET display_order = display_order + 1
  WHERE game_id = oras_id AND display_order >= 10;

  -- 4. Insertar Dewford Town en order 10, accesible después de Stone Badge
  INSERT INTO route (game_id, name, display_order, required_badge_id, encounter_type)
  VALUES (oras_id, 'Dewford Town', 10, or_stone_id, 'RANDOM')
  RETURNING id INTO new_route;

  -- 5. Nombre en español
  INSERT INTO route_name (route_id, lang, name)
  VALUES (new_route, 'es', 'Pueblo Azuliza');
END $$;
