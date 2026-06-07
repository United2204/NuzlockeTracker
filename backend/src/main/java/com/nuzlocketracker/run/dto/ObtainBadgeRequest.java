package com.nuzlocketracker.run.dto;

import jakarta.validation.constraints.NotNull;

public record ObtainBadgeRequest(@NotNull Long badgeId) {}
