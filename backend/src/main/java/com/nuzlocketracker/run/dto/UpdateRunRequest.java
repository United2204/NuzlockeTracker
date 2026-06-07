package com.nuzlocketracker.run.dto;

import jakarta.validation.constraints.Size;

public record UpdateRunRequest(
        @Size(max = 150) String name,
        String visibility,   // PUBLIC, FOLLOWERS_ONLY, PRIVATE
        String status,       // COMPLETED, ABANDONED (GAME_OVER es automático)
        Boolean favorite,
        Integer displayOrder
) {}
