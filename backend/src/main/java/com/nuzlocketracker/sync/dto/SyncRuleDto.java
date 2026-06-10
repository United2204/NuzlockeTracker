package com.nuzlocketracker.sync.dto;

import jakarta.validation.constraints.NotBlank;

public record SyncRuleDto(
        @NotBlank String ruleType,
        boolean enabled,
        String value
) {}
