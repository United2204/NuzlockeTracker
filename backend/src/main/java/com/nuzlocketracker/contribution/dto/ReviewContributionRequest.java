package com.nuzlocketracker.contribution.dto;

import jakarta.validation.constraints.NotBlank;

public record ReviewContributionRequest(
    @NotBlank String action,   // APPROVED | REJECTED | CHANGES_REQUESTED
    String adminFeedback       // required when action = CHANGES_REQUESTED
) {}
