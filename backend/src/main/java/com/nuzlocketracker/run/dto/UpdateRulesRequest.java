package com.nuzlocketracker.run.dto;

import jakarta.validation.constraints.NotNull;
import java.util.List;

public record UpdateRulesRequest(
        @NotNull List<RuleOverride> rules
) {
    public record RuleOverride(
            @NotNull String ruleType,
            boolean enabled,
            String value
    ) {}
}
