package com.nuzlocketracker.catalog.repository;

public interface PokemonSearchProjection {
    Long getId();
    Long getSpeciesId();
    Integer getNationalDexNumber();
    String getTypesJson();
    String getSpriteUrl();
    String getVariant();
    String getName();
}
