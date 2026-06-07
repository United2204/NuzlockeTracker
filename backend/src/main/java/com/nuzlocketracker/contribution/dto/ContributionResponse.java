package com.nuzlocketracker.contribution.dto;

import java.time.OffsetDateTime;
import java.util.Map;

public record ContributionResponse(
    Long id,
    String contributorUsername,
    String status,
    Long gameId,
    String gameName,
    String dataType,
    Map<String, Object> dataJson,
    String adminFeedback,
    OffsetDateTime createdAt,
    OffsetDateTime reviewedAt
) {}
