package com.nuzlocketracker.contribution;

import com.nuzlocketracker.contribution.dto.ContributionResponse;
import com.nuzlocketracker.contribution.dto.ReviewContributionRequest;
import com.nuzlocketracker.contribution.dto.SubmitContributionRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class ContributionController {

    private final ContributionService contributionService;

    @PostMapping("/api/contributions")
    @ResponseStatus(HttpStatus.CREATED)
    public ContributionResponse submit(@Valid @RequestBody SubmitContributionRequest req,
                                       Authentication auth) {
        return contributionService.submit(me(auth), req);
    }

    @GetMapping("/api/me/contributions")
    public List<ContributionResponse> myContributions(Authentication auth) {
        return contributionService.listMine(me(auth));
    }

    @PostMapping("/api/contributions/{id}/resubmit")
    public ContributionResponse resubmit(@PathVariable Long id,
                                         @Valid @RequestBody SubmitContributionRequest req,
                                         Authentication auth) {
        return contributionService.resubmit(me(auth), id, req);
    }

    // Admin endpoints

    @GetMapping("/api/admin/contributions/pending")
    public List<ContributionResponse> listPending(Authentication auth) {
        return contributionService.listPending();
    }

    @PostMapping("/api/admin/contributions/{id}/review")
    public ContributionResponse review(@PathVariable Long id,
                                       @Valid @RequestBody ReviewContributionRequest req,
                                       Authentication auth) {
        return contributionService.review(me(auth), id, req);
    }

    private UUID me(Authentication auth) {
        return UUID.fromString(auth.getName());
    }
}
