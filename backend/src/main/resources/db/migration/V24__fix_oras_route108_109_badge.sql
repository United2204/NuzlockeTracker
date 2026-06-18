-- Route 108 y Route 109 se navegan DESPUÉS de obtener la Knuckle Badge (Brawly, Dewford),
-- al zarpar hacia Ciudad Portuaria (Slateport City). V7 las marcaba como Stone Badge por error.
DO $$
DECLARE
  oras_id     BIGINT;
  or_knuckle  BIGINT;
BEGIN
  SELECT id INTO oras_id    FROM game  WHERE name = 'Pokémon ORAS';
  SELECT id INTO or_knuckle FROM badge WHERE game_id = oras_id AND name = 'Knuckle Badge';

  UPDATE route SET required_badge_id = or_knuckle
  WHERE game_id = oras_id AND name IN ('Route 108', 'Route 109');
END $$;
