package com.nuzlocketracker.run.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateRunRequest(
        @NotNull Long gameId,
        @NotBlank @Size(max = 150) String name,
        @Size(max = 10) String gameVersion,
        boolean randomized,
        Long presetId,          // null = usar preset "Clásico"
        String visibility       // PUBLIC, FOLLOWERS_ONLY, PRIVATE — null = PRIVATE
) {}
