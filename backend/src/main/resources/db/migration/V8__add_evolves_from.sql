ALTER TABLE pokemon
    ADD COLUMN evolves_from_pokemon_id BIGINT REFERENCES pokemon(id);
