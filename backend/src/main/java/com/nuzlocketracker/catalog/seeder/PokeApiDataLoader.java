package com.nuzlocketracker.catalog.seeder;

import com.nuzlocketracker.catalog.entity.Pokemon;
import com.nuzlocketracker.catalog.repository.PokemonRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Carga el catálogo de Pokémon (gen 1-6, #1-721) desde PokéAPI v2.
 * Solo corre cuando app.seed.pokemon=true (definido en application-dev.yml).
 * Es idempotente: si ya hay Pokémon en la BD, no hace nada.
 *
 * pokemon_name, pokemon_base_stats y pokemon_evolution_chain se insertan con
 * JdbcTemplate directamente para evitar el problema de entidades detached de JPA
 * que surge al llamar métodos @Transactional desde la misma clase (self-invocation).
 */
@Component
@ConditionalOnProperty(name = "app.seed.pokemon", havingValue = "true")
@RequiredArgsConstructor
@Slf4j
public class PokeApiDataLoader implements ApplicationRunner {

    private static final String BASE_URL = "https://pokeapi.co/api/v2";
    private static final int GEN_1_TO_6 = 721;
    private static final long REQUEST_DELAY_MS = 30;

    private final PokemonRepository pokemonRepository;
    private final JdbcTemplate jdbcTemplate;

    private final RestClient restClient = RestClient.create(BASE_URL);

    @Override
    public void run(ApplicationArguments args) {
        long existing = pokemonRepository.count();
        if (existing > 0) {
            log.info("Pokémon catalog already seeded ({} entries), skipping.", existing);
            return;
        }

        log.info("Seeding Pokémon catalog from PokéAPI (#{}-#{})...", 1, GEN_1_TO_6);
        int seeded = 0;
        int failed = 0;

        for (int i = 1; i <= GEN_1_TO_6; i++) {
            try {
                seedOne(i);
                seeded++;
                if (i % 100 == 0) {
                    log.info("  Progress: {}/{}", i, GEN_1_TO_6);
                }
                Thread.sleep(REQUEST_DELAY_MS);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                log.warn("Seeder interrupted at #{}", i);
                break;
            } catch (Exception e) {
                failed++;
                log.warn("Failed to seed Pokémon #{}: {}", i, e.getMessage());
            }
        }
        log.info("Pokémon catalog seed finished. Seeded: {}, Failed: {}", seeded, failed);
    }

    private void seedOne(int dexNum) {
        PokeApiDto.Pokemon pokemonDto = restClient.get()
                .uri("/pokemon/{id}", dexNum)
                .retrieve()
                .body(PokeApiDto.Pokemon.class);

        if (pokemonDto == null) throw new IllegalStateException("null response for /pokemon/" + dexNum);

        PokeApiDto.Species speciesDto = restClient.get()
                .uri(pokemonDto.species().url())
                .retrieve()
                .body(PokeApiDto.Species.class);

        if (speciesDto == null) throw new IllegalStateException("null species for Pokémon #" + dexNum);

        List<String> types = pokemonDto.types().stream()
                .sorted(Comparator.comparingInt(PokeApiDto.TypeSlot::slot))
                .map(t -> t.type().name().toUpperCase())
                .toList();

        Map<String, Integer> stats = pokemonDto.stats().stream()
                .collect(Collectors.toMap(s -> s.stat().name(), PokeApiDto.StatSlot::baseStat));

        String englishName = speciesDto.names().stream()
                .filter(n -> "en".equals(n.language().name()))
                .map(PokeApiDto.LocalizedName::name)
                .findFirst()
                .orElse(capitalize(pokemonDto.name()));

        long chainId = extractLastPathSegment(speciesDto.evolutionChain().url());

        Long evolvesFromPokemonId = null;
        if (speciesDto.evolvesFromSpecies() != null) {
            long evolvesFromDex = extractLastPathSegment(speciesDto.evolvesFromSpecies().url());
            evolvesFromPokemonId = pokemonRepository.findByNationalDexNumber((short) evolvesFromDex)
                    .map(Pokemon::getId)
                    .orElse(null);
        }

        // Guardar Pokemon con JPA para obtener el ID generado
        Pokemon pokemon = new Pokemon();
        pokemon.setSpeciesId((long) dexNum);
        pokemon.setNationalDexNumber((short) dexNum);
        pokemon.setTypes(types);
        pokemon.setSpriteUrl(pokemonDto.sprites().frontDefault());
        pokemon.setFromFangame(false);
        pokemon.setEvolvesFromPokemonId(evolvesFromPokemonId);
        Long pokemonId = pokemonRepository.save(pokemon).getId();

        // Usar JDBC para el resto: evita el problema de entidades detached con @MapsId
        jdbcTemplate.update(
                "INSERT INTO pokemon_name (pokemon_id, lang, name) VALUES (?, ?, ?)",
                pokemonId, "en", englishName
        );
        jdbcTemplate.update(
                "INSERT INTO pokemon_base_stats (pokemon_id, hp, attack, defense, sp_atk, sp_def, speed) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?)",
                pokemonId,
                stat(stats, "hp"),
                stat(stats, "attack"),
                stat(stats, "defense"),
                stat(stats, "special-attack"),
                stat(stats, "special-defense"),
                stat(stats, "speed")
        );
        jdbcTemplate.update(
                "INSERT INTO pokemon_evolution_chain (chain_id, pokemon_id) VALUES (?, ?) ON CONFLICT DO NOTHING",
                chainId, pokemonId
        );
    }

    private long extractLastPathSegment(String url) {
        String trimmed = url.endsWith("/") ? url.substring(0, url.length() - 1) : url;
        return Long.parseLong(trimmed.substring(trimmed.lastIndexOf('/') + 1));
    }

    private int stat(Map<String, Integer> stats, String key) {
        return stats.getOrDefault(key, 0);
    }

    private String capitalize(String s) {
        if (s == null || s.isEmpty()) return s;
        return Character.toUpperCase(s.charAt(0)) + s.substring(1);
    }
}
