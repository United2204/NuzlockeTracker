package com.nuzlocketracker.stats;

import com.nuzlocketracker.stats.dto.RunStatsResponse;
import com.nuzlocketracker.stats.dto.UserStatsResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class StatsController {

    private final StatsService statsService;

    @GetMapping("/api/runs/{runId}/stats")
    public RunStatsResponse getRunStats(@PathVariable UUID runId, Authentication auth) {
        return statsService.getRunStats(runId, userId(auth));
    }

    @GetMapping("/api/me/stats")
    public UserStatsResponse getUserStats(Authentication auth) {
        return statsService.getUserStats(userId(auth));
    }

    private UUID userId(Authentication auth) {
        return UUID.fromString(auth.getName());
    }
}
