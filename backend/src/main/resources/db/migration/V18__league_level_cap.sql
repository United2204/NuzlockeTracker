-- Allow gym entries without a badge (Pokémon League / Champion)
ALTER TABLE gym ALTER COLUMN badge_id DROP NOT NULL;

-- XY: Diantha (Champion, Mega Gardevoir lv 65)
INSERT INTO gym (game_id, badge_id, leader_name, display_order, ace_pokemon_level)
SELECT id, NULL, 'Diantha', 9, 65 FROM game WHERE name = 'Pokémon X/Y';

-- ORAS: Steven (Champion, Mega Metagross lv 70)
INSERT INTO gym (game_id, badge_id, leader_name, display_order, ace_pokemon_level)
SELECT id, NULL, 'Steven', 9, 70 FROM game WHERE name = 'Pokémon ORAS';
