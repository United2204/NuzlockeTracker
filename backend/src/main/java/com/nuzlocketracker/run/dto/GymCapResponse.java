package com.nuzlocketracker.run.dto;

public record GymCapResponse(
        Long badgeId,
        String badgeName,
        String leaderName,
        int acePokemonLevel,
        int levelCap
) {}
