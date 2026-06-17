package com.nuzlocketracker.catalog.seeder;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

/**
 * DTOs mínimos para deserializar las respuestas de PokéAPI v2.
 * Solo se mapean los campos que el seeder necesita.
 */
public class PokeApiDto {

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Pokemon(
            int id,
            String name,
            int weight,
            Sprites sprites,
            List<TypeSlot> types,
            List<StatSlot> stats,
            SpeciesRef species
    ) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Sprites(
            @JsonProperty("front_default") String frontDefault
    ) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record TypeSlot(
            int slot,
            TypeRef type
    ) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record TypeRef(String name) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record StatSlot(
            @JsonProperty("base_stat") int baseStat,
            StatRef stat
    ) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record StatRef(String name) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record SpeciesRef(String url) {}

    // ── pokemon-species/{id} ─────────────────────────────────

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Species(
            int id,
            List<LocalizedName> names,
            @JsonProperty("evolution_chain") ChainRef evolutionChain,
            @JsonProperty("evolves_from_species") SpeciesRef evolvesFromSpecies
    ) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record LocalizedName(
            String name,
            Language language
    ) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Language(String name) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record ChainRef(String url) {}
}
