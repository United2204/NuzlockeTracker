package com.nuzlocketracker.contribution;

import com.nuzlocketracker.auth.entity.User;
import com.nuzlocketracker.auth.entity.UserRole;
import com.nuzlocketracker.auth.repository.UserRepository;
import com.nuzlocketracker.catalog.entity.Game;
import com.nuzlocketracker.catalog.repository.GameRepository;
import com.nuzlocketracker.common.exception.ResourceNotFoundException;
import com.nuzlocketracker.contribution.dto.ContributionResponse;
import com.nuzlocketracker.contribution.dto.ReviewContributionRequest;
import com.nuzlocketracker.contribution.dto.SubmitContributionRequest;
import com.nuzlocketracker.contribution.entity.CommunityContribution;
import com.nuzlocketracker.contribution.entity.ContributionDataType;
import com.nuzlocketracker.contribution.entity.ContributionStatus;
import com.nuzlocketracker.contribution.repository.CommunityContributionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ContributionService {

    private final CommunityContributionRepository contributionRepo;
    private final UserRepository userRepo;
    private final GameRepository gameRepo;

    private static final int CONTRIBUTOR_THRESHOLD = 5;

    @Transactional
    public ContributionResponse submit(UUID contributorId, SubmitContributionRequest req) {
        User contributor = userRepo.findById(contributorId)
            .orElseThrow(() -> new ResourceNotFoundException("User", contributorId));
        Game game = gameRepo.findById(req.gameId())
            .orElseThrow(() -> new ResourceNotFoundException("Game", req.gameId()));

        ContributionDataType dataType;
        try {
            dataType = ContributionDataType.valueOf(req.dataType());
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid dataType: " + req.dataType());
        }

        CommunityContribution c = new CommunityContribution();
        c.setContributor(contributor);
        c.setGame(game);
        c.setDataType(dataType);
        c.setDataJson(req.dataJson());

        return toResponse(contributionRepo.save(c));
    }

    @Transactional(readOnly = true)
    public List<ContributionResponse> listPending() {
        return contributionRepo.findByStatusOrderByCreatedAt(ContributionStatus.PENDING)
            .stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<ContributionResponse> listMine(UUID contributorId) {
        return contributionRepo.findByContributorIdOrderByCreatedAt(contributorId)
            .stream().map(this::toResponse).toList();
    }

    @Transactional
    public ContributionResponse review(UUID adminId, Long contributionId, ReviewContributionRequest req) {
        User admin = userRepo.findById(adminId)
            .orElseThrow(() -> new ResourceNotFoundException("User", adminId));

        if (admin.getRole() != UserRole.ADMIN) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Solo los admins pueden revisar contribuciones");
        }

        CommunityContribution c = contributionRepo.findById(contributionId)
            .orElseThrow(() -> new ResourceNotFoundException("Contribution", contributionId));

        if (c.getStatus() != ContributionStatus.PENDING && c.getStatus() != ContributionStatus.CHANGES_REQUESTED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Esta contribución ya fue revisada");
        }

        ContributionStatus newStatus;
        try {
            newStatus = ContributionStatus.valueOf(req.action());
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Acción inválida: " + req.action());
        }

        if (newStatus == ContributionStatus.CHANGES_REQUESTED
                && (req.adminFeedback() == null || req.adminFeedback().isBlank())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "adminFeedback es requerido cuando se solicitan cambios");
        }

        if (newStatus == ContributionStatus.PENDING) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "No se puede establecer el estado a PENDING manualmente");
        }

        c.setStatus(newStatus);
        c.setReviewedBy(admin);
        c.setAdminFeedback(req.adminFeedback());
        c.setReviewedAt(OffsetDateTime.now());

        if (newStatus == ContributionStatus.APPROVED) {
            User contributor = c.getContributor();
            int newCount = contributor.getApprovedContributionCount() + 1;
            contributor.setApprovedContributionCount(newCount);
            if (contributor.getRole() == UserRole.USER && newCount >= CONTRIBUTOR_THRESHOLD) {
                contributor.setRole(UserRole.CONTRIBUTOR);
            }
            userRepo.save(contributor);
        }

        return toResponse(contributionRepo.save(c));
    }

    @Transactional
    public ContributionResponse resubmit(UUID contributorId, Long contributionId, SubmitContributionRequest req) {
        CommunityContribution c = contributionRepo.findById(contributionId)
            .orElseThrow(() -> new ResourceNotFoundException("Contribution", contributionId));

        if (!c.getContributor().getId().equals(contributorId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No sos el autor de esta contribución");
        }
        if (c.getStatus() != ContributionStatus.CHANGES_REQUESTED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                "Solo se pueden reenviar contribuciones con estado CHANGES_REQUESTED");
        }

        c.setDataJson(req.dataJson());
        c.setStatus(ContributionStatus.PENDING);
        c.setAdminFeedback(null);
        c.setReviewedAt(null);
        c.setReviewedBy(null);

        return toResponse(contributionRepo.save(c));
    }

    private ContributionResponse toResponse(CommunityContribution c) {
        return new ContributionResponse(
            c.getId(),
            c.getContributor().getUsername(),
            c.getStatus().name(),
            c.getGame().getId(),
            c.getGame().getName(),
            c.getDataType().name(),
            c.getDataJson(),
            c.getAdminFeedback(),
            c.getCreatedAt(),
            c.getReviewedAt()
        );
    }
}
