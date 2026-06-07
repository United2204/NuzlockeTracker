package com.nuzlocketracker.catalog.repository;

public interface EncounterSuggestionProjection {
    Long getId();
    String getName();
    String getTypesJson();
    String getSpriteUrl();
    String getVariant();
    String getEncounterType();
    Integer getRarity();
    String getGameVersion();
}
