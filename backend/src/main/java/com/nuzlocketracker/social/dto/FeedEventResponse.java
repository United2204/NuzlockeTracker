package com.nuzlocketracker.social.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

public record FeedEventResponse(
        Long eventId,
        UUID runId,
        String runName,
        String runSlug,
        String username,
        String eventType,
        String payload,
        OffsetDateTime occurredAt
) {}
