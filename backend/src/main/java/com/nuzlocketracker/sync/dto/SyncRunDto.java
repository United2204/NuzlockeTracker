package com.nuzlocketracker.sync.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.Valid;

import java.util.List;
import java.util.UUID;

public record SyncRunDto(
        @NotNull UUID id,
        @NotNull Long gameId,
        @NotBlank String name,
        @NotBlank String slug,
        String gameVersion,
        boolean randomized,
        String status,
        String visibility,
        boolean favorite,
        boolean archived,
        int displayOrder,
        @Valid List<SyncRuleDto> rules
) {}
