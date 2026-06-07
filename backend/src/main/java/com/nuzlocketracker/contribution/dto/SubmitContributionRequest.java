package com.nuzlocketracker.contribution.dto;

import jakarta.validation.constraints.NotNull;

import java.util.Map;

public record SubmitContributionRequest(
    @NotNull Long gameId,
    @NotNull String dataType,
    @NotNull Map<String, Object> dataJson
) {}
