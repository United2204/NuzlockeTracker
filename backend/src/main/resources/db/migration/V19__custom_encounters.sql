-- Custom encounter slots: Pokémon that don't belong to a catalog route
-- (gifts, eggs, fossils, legendaries, trades, static encounters, ROM hack routes)
ALTER TABLE route_encounter
    ADD COLUMN custom_name VARCHAR(200),
    ADD COLUMN custom_encounter_type VARCHAR(20);

ALTER TABLE route_encounter ALTER COLUMN route_id DROP NOT NULL;

ALTER TABLE route_encounter ADD CONSTRAINT chk_route_xor_custom CHECK (
    (route_id IS NOT NULL AND custom_name IS NULL) OR
    (route_id IS NULL AND custom_name IS NOT NULL AND custom_encounter_type IS NOT NULL)
);
