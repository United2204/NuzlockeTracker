-- En la progresión de Hoenn (ORAS), la Ruta 103 se habilita para capturar antes que la Ruta 102:
-- desde Pueblo Escaso → Ruta 101 → Pueblo Escaso, primero se accede a la Ruta 103 (combate rival)
-- y luego a la Ruta 102 (hacia Ciudad Petalia). Intercambiamos su display_order.

UPDATE route SET display_order = 3
WHERE name = 'Route 103'
  AND game_id = (SELECT id FROM game WHERE name = 'Pokémon ORAS');

UPDATE route SET display_order = 4
WHERE name = 'Route 102'
  AND game_id = (SELECT id FROM game WHERE name = 'Pokémon ORAS');
