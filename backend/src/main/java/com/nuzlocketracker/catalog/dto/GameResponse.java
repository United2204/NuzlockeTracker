package com.nuzlocketracker.catalog.dto;

import com.nuzlocketracker.catalog.entity.Game;

import java.util.List;

public record GameResponse(
        Long id,
        String name,
        int generation,
        boolean official,
        List<String> versions,
        String coverImageUrl
) {
    public static GameResponse from(Game g) {
        return new GameResponse(
                g.getId(), g.getName(), g.getGeneration(),
                g.isOfficial(), g.getVersions(), g.getCoverImageUrl()
        );
    }
}
