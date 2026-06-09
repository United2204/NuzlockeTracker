package com.nuzlocketracker.catalog.seeder;

import com.nuzlocketracker.catalog.entity.Pokemon;
import com.nuzlocketracker.catalog.repository.PokemonRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.List;

/**
 * Backfill one-time para poblar evolves_from_pokemon_id desde PokéAPI.
 * Solo corre cuando app.seed.evolutions=true.
 * Es idempotente: si ya hay datos, no hace nada.
 * Después de correrlo una vez, deshabilitar la property.
 */
@Component
@ConditionalOnProperty(name = "app.seed.evolutions", havingValue = "true")
@Order(2)
@RequiredArgsConstructor
@Slf4j
public class EvolvesFromBackfiller implements ApplicationRunner {

    private static final String BASE_URL = "https://pokeapi.co/api/v2";
    private static final long REQUEST_DELAY_MS = 30;

    private final PokemonRepository pokemonRepository;
    private final RestClient restClient = RestClient.create(BASE_URL);

    @Override
    public void run(ApplicationArguments args) {
        if (pokemonRepository.countWithEvolvesFrom() > 0) {
            log.info("evolves_from_pokemon_id already populated, skipping backfill.");
            return;
        }

        List<Pokemon> allPokemon = pokemonRepository.findAll();
        log.info("Backfilling evolves_from_pokemon_id for {} Pokémon...", allPokemon.size());
        int updated = 0;

        for (Pokemon p : allPokemon) {
            if (p.getNationalDexNumber() == null) continue;
            try {
                PokeApiDto.Species species = restClient.get()
                        .uri("/pokemon-species/{id}", p.getNationalDexNumber())
                        .retrieve()
                        .body(PokeApiDto.Species.class);

                if (species != null && species.evolvesFromSpecies() != null) {
                    long fromDex = extractLastPathSegment(species.evolvesFromSpecies().url());
                    pokemonRepository.findByNationalDexNumber((short) fromDex).ifPresent(from -> {
                        p.setEvolvesFromPokemonId(from.getId());
                        pokemonRepository.save(p);
                    });
                    updated++;
                }
                Thread.sleep(REQUEST_DELAY_MS);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                break;
            } catch (Exception e) {
                log.warn("Failed to backfill evolves_from for #{}: {}", p.getNationalDexNumber(), e.getMessage());
            }
        }
        log.info("Backfill done. Updated {} Pokémon with evolves_from_pokemon_id.", updated);
    }

    private long extractLastPathSegment(String url) {
        String trimmed = url.endsWith("/") ? url.substring(0, url.length() - 1) : url;
        return Long.parseLong(trimmed.substring(trimmed.lastIndexOf('/') + 1));
    }
}
