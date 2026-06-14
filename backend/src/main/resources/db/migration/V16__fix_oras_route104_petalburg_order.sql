-- En ORAS, el jugador accede a la Ruta 104 (sur) antes de entrar al Bosque Petalia.
-- V7 los insertó en orden inverso. Intercambiamos sus display_order.

UPDATE route SET display_order = 5
WHERE name = 'Route 104'
  AND game_id = (SELECT id FROM game WHERE name = 'Pokémon ORAS');

UPDATE route SET display_order = 6
WHERE name = 'Petalburg Woods'
  AND game_id = (SELECT id FROM game WHERE name = 'Pokémon ORAS');
