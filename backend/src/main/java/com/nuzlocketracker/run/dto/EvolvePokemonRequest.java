package com.nuzlocketracker.run.dto;

import jakarta.validation.constraints.NotNull;

public record EvolvePokemonRequest(@NotNull Long targetPokemonId) {}
