package com.nuzlocketracker.social.dto;

import jakarta.validation.constraints.NotNull;

public record ToggleReactionRequest(@NotNull Long reactionTypeId) {}
