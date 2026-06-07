package com.nuzlocketracker.run.dto;

import com.nuzlocketracker.run.entity.RunRule;

public record RunRuleResponse(String ruleType, boolean enabled, String value) {
    public static RunRuleResponse from(RunRule rule) {
        return new RunRuleResponse(rule.getRuleType().name(), rule.isEnabled(), rule.getValue());
    }
}
